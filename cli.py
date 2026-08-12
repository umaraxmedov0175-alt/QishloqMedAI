import socket
import json

def send_tcp_request():
    # 1. Asosiy so'rov matni (Input)
    user_input = "Bosh og'rig'i va qon bosimi oshishi kuzatilmoqda, qanday maslahat berasiz?"
    
    # 2. Input oldiga "P:" qo'shish
    formatted_prompt = f"P:{user_input}"

    # 3. Yuboriladigan ma'lumot (rasm hozircha shart emas, bo'sh qoldiramiz)
    payload = {
        "prompt": formatted_prompt,
        "image_base64": "" 
    }
    
    # 4. JSON ga o'tkazish va server tushunishi uchun oxiriga <EOF> qo'shish
    data_to_send = json.dumps(payload) + "<EOF>"

    # 5. AI TCP Serveriga ulanish 
    client = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
    
    try:
        # Cloudflared ochib bergan lokal portga ulanamiz
        client.connect(('127.0.0.1', 8888))
        
        print(f"Yuborilmoqda: {formatted_prompt}")
        client.sendall(data_to_send.encode('utf-8'))

        # AI dan javob kutish
        print("AI tahlil qilmoqda, kuting...")
        response_data = client.recv(16384).decode('utf-8')
        response = json.loads(response_data)
        
        print("\n🏥 MEDAI XULOSASI:")
        print(response.get("report"))
        
    except ConnectionRefusedError:
        print("XATOLIK: Ulanish rad etildi!")
        print("Iltimos, avval terminalda 'cloudflared access tcp ...' buyrug'ini ishga tushirganingizni tekshiring.")
    except Exception as e:
        print(f"Kutilmagan xatolik yuz berdi: {e}")
    finally:
        client.close()

if __name__ == "__main__":
    send_tcp_request()
