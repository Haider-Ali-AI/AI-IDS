"""
==============================================================================
 LLM-Powered Intrusion Detection System (IDS)
 ARIA: AI Security Copilot / SOC Agent
==============================================================================
"""

import json
import logging
from typing import List, Dict, Any, AsyncGenerator

from google import genai
from google.genai import types

from config import settings

logger = logging.getLogger("ids.aria")

ARIA_SYSTEM_PROMPT = """You are ARIA (Autonomous Response Intelligence Analyst), an elite AI-powered SOC analyst embedded in a real-time cybersecurity platform.

Your mission: Provide fast, precise, and highly technical support to human security operators.

You have access to:
1. Live network alerts and metadata
2. Threat actor profiles and attack chains (MACE)
3. MITRE ATT&CK knowledge base (RAG)

Rules for your responses:
- Be concise, direct, and professional. Analysts are busy.
- Use bullet points for readability.
- Always cite MITRE technique IDs when discussing attacks.
- If recommending actions (like blocking an IP), provide the exact command or explicit instruction.
- Do NOT hallucinate data. If you don't see it in the context, say "I don't have enough data to confirm."
- Format outputs beautifully using markdown.
"""


class ARIAAgent:
    """
    Conversational SOC Copilot.
    Takes user queries, enriches them with DB/RAG context, and streams
    LLM responses back to the dashboard.
    """

    def __init__(self, db_manager, rag_engine=None):
        self.db_manager = db_manager
        self.rag_engine = rag_engine
        
        self.client = genai.Client(api_key=settings.gemini_api_key)
        self.model_name = settings.gemini_model

    async def _gather_context(self, query: str) -> str:
        """Gather relevant context from SQLite and ChromaDB."""
        context_parts = []
        
        # 1. Get recent DB alerts
        try:
            recent_alerts = await self.db_manager.get_recent_alerts(limit=5)
            if recent_alerts:
                alert_str = json.dumps([{
                    "id": a["id"], 
                    "ip": a["src_ip"], 
                    "threat": a["threat_level"],
                    "attack": a["attack_vector"]
                } for a in recent_alerts], indent=2)
                context_parts.append(f"--- RECENT ALERTS ---\n{alert_str}")
        except Exception as e:
            logger.warning(f"ARIA DB context error: {e}")

        # 2. Get active chains from MACE
        try:
            active_chains = await self.db_manager.get_active_chains()
            if active_chains:
                chain_str = json.dumps([{
                    "chain_id": c["chain_id"],
                    "actor_ip": c["actor_id"],
                    "score": c["chain_score"],
                    "phases": c["kill_chain_phases"]
                } for c in active_chains], indent=2)
                context_parts.append(f"--- ACTIVE ATTACK CHAINS (MACE) ---\n{chain_str}")
        except Exception as e:
            logger.warning(f"ARIA Chain context error: {e}")

        # 3. Query RAG Engine (if enabled)
        if self.rag_engine and settings.rag_enabled:
            try:
                # We do a generic search using the user's query
                rag_context = self.rag_engine.query_context([query])
                if rag_context:
                    context_parts.append(f"--- MITRE ATT&CK KNOWLEDGE BASE ---\n{rag_context}")
            except Exception as e:
                logger.warning(f"ARIA RAG error: {e}")

        return "\n\n".join(context_parts)

    async def stream_chat(self, message: str, history: List[Dict[str, str]]) -> AsyncGenerator[str, None]:
        """
        Stream a response from Gemini, given the user message and history.
        """
        try:
            # 1. Build context
            system_context = await self._gather_context(message)
            
            full_system_instruction = ARIA_SYSTEM_PROMPT + "\n\n" + system_context
            
            # 2. Format history for Gemini
            # Google GenAI SDK expects Content objects for history
            contents = []
            for msg in history:
                role = "user" if msg["role"] == "user" else "model"
                contents.append(
                    types.Content(role=role, parts=[types.Part.from_text(msg["content"])])
                )
                
            # Add the current message
            contents.append(
                types.Content(role="user", parts=[types.Part.from_text(message)])
            )
            
            config = types.GenerateContentConfig(
                system_instruction=full_system_instruction,
                temperature=0.3,
            )

            # 3. Call streaming API
            # Since GenAI streaming is synchronous in the SDK for now, we wrap it
            # Or use async if supported. The new SDK supports async via `aio`.
            response = await self.client.aio.models.generate_content_stream(
                model=self.model_name,
                contents=contents,
                config=config
            )
            
            async for chunk in response:
                if chunk.text:
                    yield chunk.text

        except Exception as e:
            logger.error(f"ARIA stream error: {e}", exc_info=True)
            yield f"**System Error:** I am currently experiencing technical difficulties. Details: {str(e)}"
