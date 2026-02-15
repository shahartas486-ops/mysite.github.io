import requests
import json
import random
from datetime import datetime

class AIService:
    def __init__(self, api_key=None, api_url=None, model=None):
        self.api_key = api_key
        self.api_url = api_url
        self.model = model or 'gpt-3.5-turbo'
        self.local_responses = self._load_local_responses()
    
    def _load_local_responses(self):
        """پاسخ‌های محلی برای مواقع قطعی API"""
        return {
            "سلام": "سلام! چطور می‌تونم کمکتون کنم؟ 😊",
            "خداحافظ": "خداحافظ! منتظر بازگشت شما هستم 👋",
            "تشکر": "خواهش می‌کنم! خوشحالم که می‌تونم کمک کنم 🤗",
            "اسم": "من دستیار هوش مصنوعی ChatGPT هستم! 🤖",
            "چطوری": "من خوبم ممنون! شما چطورید؟ 😊",
            "ریاضی": "برای سوالات ریاضی می‌تونید از LaTeX استفاده کنید. مثلاً: $E = mc^2$",
            "کمک": "من می‌تونم در موضوعات مختلف کمکتون کنم. سوالاتتون رو بپرسید!",
            "برنامه‌نویسی": "در مورد کد و برنامه‌نویسی هم می‌تونم کمک کنم!",
            "طرف": "روز خوبی داشته باشید! 🌞",
            "ساعت": f"الان ساعت {datetime.now().strftime('%H:%M')} هست."
        }
    
    def get_response(self, user_input, use_real_ai=True):
        """دریافت پاسخ از ChatGPT"""
        if not user_input:
            return "سوال خودتون رو بپرسید! 😊"
        
        user_input_lower = user_input.lower()
        
        # اول چک کن ببین پاسخ از پیش تعریف شده داریم
        for key in self.local_responses:
            if key in user_input_lower:
                return self.local_responses[key]
        
        # اگر API key موجود بود، از ChatGPT استفاده کن
        if use_real_ai and self.api_key and self.api_url:
            try:
                ai_response = self._call_chatgpt(user_input)
                return self._clean_response(ai_response)
            except Exception as e:
                print(f"ChatGPT API Error: {e}")
                # اگر خطا داشت، به پاسخ‌های محلی برو
                return self._get_fallback_response(user_input)
        
        # در غیر این صورت از پاسخ‌های محلی استفاده کن
        return self._get_fallback_response(user_input)
    
    def _call_chatgpt(self, user_input):
        """تماس با ChatGPT API"""
        headers = {
            'Authorization': f'Bearer {self.api_key}',
            'Content-Type': 'application/json'
        }
        
        # پیام‌های مکالمه - بهینه‌سازی برای فارسی
        messages = [
            {
                "role": "system",
                "content": """تو یک دستیار هوش مصنوعی فارسی به نام ChatGPT هستی. 
                قوانین:
                1. همیشه به زبان فارسی پاسخ بده
                2. مهربان و مفید باش
                3. پاسخ‌ها رو کوتاه و مفید ارائه بده
                4. از اموجی مناسب استفاده کن 😊
                5. اگر سوال ریاضی بود، از LaTeX استفاده کن
                6. اگر نمی‌دونی، صادقانه بگو
                
                شخصیت: دوستانه، باهوش، کمک‌کننده"""
            },
            {
                "role": "user",
                "content": user_input
            }
        ]
        
        data = {
            "model": self.model,
            "messages": messages,
            "max_tokens": 1000,
            "temperature": 0.7,
            "top_p": 1,
            "frequency_penalty": 0,
            "presence_penalty": 0
        }
        
        try:
            response = requests.post(
                self.api_url,
                headers=headers,
                json=data,
                timeout=30  # 30 ثانیه timeout
            )
            
            response.raise_for_status()  # اگر خطای HTTP بود، exception بده
            
            result = response.json()
            
            if 'choices' in result and len(result['choices']) > 0:
                ai_response = result['choices'][0]['message']['content']
                return ai_response
            else:
                raise Exception("No response from ChatGPT API")
                
        except requests.exceptions.Timeout:
            raise Exception("زمان پاسخ‌گویی به پایان رسید. لطفاً دوباره تلاش کنید.")
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP Error: {e.response.status_code}"
            if e.response.status_code == 401:
                error_msg = "API Key نامعتبر است!"
            elif e.response.status_code == 429:
                error_msg = "محدودیت rate limit! لطفاً کمی صبر کنید."
            elif e.response.status_code == 500:
                error_msg = "سرور OpenAI مشکل دارد."
            raise Exception(error_msg)
        except Exception as e:
            raise Exception(f"خطا در ارتباط با ChatGPT: {str(e)}")
    
    def _clean_response(self, response):
        """تمیز کردن پاسخ ChatGPT"""
        # حذف کلمات اضافی
        unwanted_prefixes = [
            "به عنوان یک دستیار هوش مصنوعی",
            "به عنوان ChatGPT",
            "به عنوان یک مدل زبانی",
            "من یک هوش مصنوعی هستم",
            "خب، ",
            "باشه، ",
            "اوکی، ",
            "ببین، ",
            "عالی، ",
            "ممنون از سوال شما.",
            "سوال جالبی پرسیدید.",
            "بیایید در مورد این موضوع صحبت کنیم."
        ]
        
        cleaned_response = response.strip()
        
        for prefix in unwanted_prefixes:
            if cleaned_response.startswith(prefix):
                cleaned_response = cleaned_response[len(prefix):].strip()
        
        # اضافه کردن اموجی به برخی پاسخ‌ها
        if any(word in cleaned_response.lower() for word in ['سلام', 'درود', 'صب بخیر']):
            if '😊' not in cleaned_response:
                cleaned_response += ' 😊'
        
        elif any(word in cleaned_response.lower() for word in ['خداحافظ', 'بدرود', 'خدانگهدار']):
            if '👋' not in cleaned_response:
                cleaned_response += ' 👋'
        
        elif '?' in cleaned_response and '❓' not in cleaned_response:
            cleaned_response = cleaned_response.replace('?', '? ❓')
        
        return cleaned_response
    
    def _get_fallback_response(self, user_input=None):
        """پاسخ‌های جایگزین اگر ChatGPT کار نکرد"""
        # پاسخ‌های هوشمند بر اساس نوع سوال
        if user_input:
            user_input_lower = user_input.lower()
            
            if any(word in user_input_lower for word in ['چطور', 'چگونه', 'راهنمایی']):
                return "برای راهنمایی دقیق‌تر، لطفاً سوال خود را با جزئیات بیشتری مطرح کنید. 🤔"
            
            elif any(word in user_input_lower for word in ['کی', 'چه زمانی', 'تاریخ']):
                return f"در مورد زمان، الان {datetime.now().strftime('%H:%M')} هست. ⏰"
            
            elif any(word in user_input_lower for word in ['ریاضی', 'محاسبه', 'فرمول']):
                return "برای محاسبات ریاضی، لطفاً فرمول را به صورت LaTeX بنویسید: $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$"
        
        # پاسخ‌های عمومی
        fallback_responses = [
            "در حال پردازش سوال شما... 🔄",
            "بگذارید در مورد این موضوع فکر کنم... 💭",
            "سوال جالبی است! می‌تونید بیشتر توضیح بدید؟ 🤔",
            "برای پاسخ دقیق‌تر، لطفاً سوال خود را با جزئیات بیشتری مطرح کنید.",
            "در حال حاضر ChatGPT در دسترس است. سوال خود را بپرسید!",
            "می‌تونم در موضوعات مختلف کمکتون کنم. سوال دیگه‌ای دارید؟",
            "ممنون از صبر شما! در حال بررسی سوال شما هستم... ⏳",
            "لطفاً کمی صبر کنید، در حال آماده‌سازی پاسخ شما هستم. 🌟"
        ]
        
        return random.choice(fallback_responses)