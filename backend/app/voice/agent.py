import re
from datetime import datetime, timedelta
from typing import Dict, Any, Optional

class VoiceAgentProvider:
    """
    Abstract interface for AI Voice Reminder Agent.
    Supports clean separation of simulated demo mode and live telephony (Twilio / Exotel / Bhashini).
    """
    async def initiate_call(self, contact_person: str, contact_phone: str, institution_name: str, pending_item: str, language: str = "English") -> Dict[str, Any]:
        raise NotImplementedError

    async def classify_intent(self, user_response_text: str) -> Dict[str, Any]:
        raise NotImplementedError

    async def generate_summary(self, institution_name: str, pending_item: str, user_response_text: str, intent: str, promised_date: Optional[datetime]) -> str:
        raise NotImplementedError


class SimulatedVoiceAgent(VoiceAgentProvider):
    """
    Interactive and transparent simulated AI Voice Call Agent for demonstrations.
    Does not fake live carrier connections; clearly tags records with SIMULATED mode.
    Accurately classifies 9 standardized regulatory intents and extracts promised submission dates.
    """

    INTENT_KEYWORDS = {
        "SUBMITTED": ["already submitted", "have submitted", "uploaded yesterday", "uploaded on portal", "done already", "submitted it"],
        "NOT_SUBMITTED": ["not submitted", "haven't done", "did not submit", "pending from our side", "no we did not"],
        "NEEDS_MORE_TIME": ["need more time", "few more days", "next week", "submit by friday", "give us time", "extension", "delay", "on monday", "tomorrow", "friday", "monday", "tuesday", "wednesday", "thursday", "will submit", "submit next", "later this week"],
        "NEEDS_HELP": ["technical problem", "portal error", "cannot upload", "need guidance", "help", "password problem", "login issue"],
        "WRONG_PERSON": ["wrong number", "not principal", "left institution", "no longer working", "wrong person"],
        "REQUESTS_HUMAN": ["speak to officer", "call officer", "talk to human", "representative", "regional officer contact"],
        "CALL_FAILED": ["network error", "busy", "disconnected"],
        "NO_ANSWER": ["ringing", "no answer", "voicemail"]
    }

    async def initiate_call(
        self,
        contact_person: str,
        contact_phone: str,
        institution_name: str,
        pending_item: str,
        language: str = "English",
        submission_deadline: Optional[str] = None
    ) -> Dict[str, Any]:
        deadline_phrase = f" which had a prescribed submission deadline of {submission_deadline}" if submission_deadline else ""
        
        if language == "Hindi":
            script = (
                f"नमस्ते। यह अखिल भारतीय तकनीकी शिक्षा परिषद (AICTE) का स्वचालित अनुपालन सहायक है। "
                f"क्या मैं {institution_name} से {contact_person} जी से बात कर रहा हूँ? "
                f"हम आपकी लंबित विनियामक आवश्यकता: '{pending_item}'{f', जिसकी अंतिम तिथि {submission_deadline} थी,' if submission_deadline else ''} के संबंध में संपर्क कर रहे हैं। "
                f"कृपया अपनी वर्तमान सबमिशन स्थिति और अपेक्षित जमा करने की तारीख साझा करें।"
            )
        elif language == "Marathi":
            script = (
                f"नमस्कार. हे अखिल भारतीय तंत्रशिक्षण परिषदेचे (AICTE) स्वयंचलित नियमन स्मरण सहाय्यक आहे. "
                f"मी {institution_name} मधील {contact_person} यांच्याशी बोलत आहे का? "
                f"आम्ही आपल्या प्रलंबित आवश्यक कागदपत्र: '{pending_item}'{f', ज्याची अंतिम मुदत {submission_deadline} होती,' if submission_deadline else ''} संदर्भात संपर्क करत आहोत. "
                f"कृपया आपली सद्यस्थिती सांगा."
            )
        else:
            script = (
                f"Namaskar. This is the automated AI compliance reminder assistant from AICTE. "
                f"Am I speaking with {contact_person} from {institution_name}? "
                f"We are calling regarding your pending regulatory requirement: '{pending_item}'{deadline_phrase}. "
                f"Officer reminders have been issued, but mandatory submission remains pending on the AICTE portal. "
                f"Could you please state what is pending from your side and the expected date of submission?"
            )
        return {
            "status": "CONNECTED",
            "provider_mode": "SIMULATED",
            "language": language,
            "system_opening_prompt": script,
            "disclaimer": "Automated AI reminder assistant. No statutory decision authority."
        }

    async def classify_intent(self, user_response_text: str) -> Dict[str, Any]:
        text_lower = user_response_text.lower()
        matched_intent = "UNCLEAR_RESPONSE"

        for intent, keywords in self.INTENT_KEYWORDS.items():
            for kw in keywords:
                if kw in text_lower:
                    matched_intent = intent
                    break
            if matched_intent != "UNCLEAR_RESPONSE":
                break

        # Date extraction
        promised_date = None
        now = datetime.utcnow()
        if "friday" in text_lower:
            days_ahead = (4 - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            promised_date = now + timedelta(days=days_ahead)
        elif "monday" in text_lower:
            days_ahead = (0 - now.weekday()) % 7
            if days_ahead == 0:
                days_ahead = 7
            promised_date = now + timedelta(days=days_ahead)
        elif "tomorrow" in text_lower:
            promised_date = now + timedelta(days=1)
        elif "next week" in text_lower:
            promised_date = now + timedelta(days=7)
        elif "few days" in text_lower or "3 days" in text_lower:
            promised_date = now + timedelta(days=3)

        return {
            "intent": matched_intent,
            "promised_date": promised_date,
            "confidence": 0.94 if matched_intent != "UNCLEAR_RESPONSE" else 0.40
        }

    async def generate_summary(
        self,
        institution_name: str,
        pending_item: str,
        user_response_text: str,
        intent: str,
        promised_date: Optional[datetime]
    ) -> str:
        date_str = promised_date.strftime('%d-%b-%Y') if promised_date else "None specified"
        summary = (
            f"[AI Voice Reminder Record - Simulated Call]\n"
            f"Institution: {institution_name}\n"
            f"Item: {pending_item}\n"
            f"Representative Stated: \"{user_response_text}\"\n"
            f"Classified Intent: {intent}\n"
            f"Extracted Promised Date: {date_str}\n"
            f"Regulatory Safeguard: Verification remains pending until authorized officer approval."
        )
        return summary
