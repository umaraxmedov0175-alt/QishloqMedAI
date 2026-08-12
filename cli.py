import requests
import sys

URL = "https://olympic-example-interviews-promoted.trycloudflare.com"
COLOR_GREEN = '\033[92m'
COLOR_BLUE = '\033[94m'
COLOR_YELLOW = '\033[93m'
COLOR_RESET = '\033[0m'
COLOR_RED = '\033[91m'

def chat_interface():
    print(f"{COLOR_GREEN}=========================================={COLOR_RESET}")
    print(f"{COLOR_GREEN}      🏥 MEDAI CLI TIZIMIGA XUSH KELIBSIZ   {COLOR_RESET}")
    print(f"{COLOR_GREEN}=========================================={COLOR_RESET}")
    print("Muloqotni to'xtatish uchun 'exit' yoki 'quit' deb yozing.\n")

    while True:
        try:
            user_input = input(f"{COLOR_BLUE}Siz: {COLOR_RESET}")
            if user_input.strip().lower() in ['exit', 'quit']:
                print("Tizimdan chiqildi. Salomat bo'ling!")
                break

            if not user_input.strip():
                continue

            payload = f"P:{user_input}"

            print(f"{COLOR_YELLOW}MedAI o'ylamoqda... kuting...{COLOR_RESET}")

            response = requests.post(URL, data=payload.encode('utf-8'))

            if response.status_code == 200:
                try:
                    data = response.json()
                    if data.get("status") == "success":
                        report = data.get("report")
                        print(f"\n{COLOR_GREEN}🤖 MedAI:{COLOR_RESET}\n{report}\n")
                    else:
                        print(f"\n{COLOR_RED}Xatolik: {data.get('message')}{COLOR_RESET}\n")
                except ValueError:
                    print(f"\n{COLOR_GREEN}🤖 MedAI:{COLOR_RESET}\n{response.text}\n")
            else:
                print(f"\n{COLOR_RED}Tarmoq xatosi! Status: {response.status_code}{COLOR_RESET}")
                print(response.text)

        except KeyboardInterrupt:
            print("\nDasur to'xtatildi.")
            sys.exit(0)
        except requests.exceptions.RequestException as e:
            print(f"\n{COLOR_RED}Ulanishda xatolik yuz berdi:{COLOR_RESET}")
            print(f"Internetni yoki Cloudflare havolangiz ishlayotganini tekshiring.\nBatafsil: {e}\n")

if __name__ == "__main__":
    chat_interface()
