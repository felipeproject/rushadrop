import json
import requests
from bs4 import BeautifulSoup
import time

ARQUIVO_JSON = "dados/times.json"

def pegar_kd(nick):
    if nick == "*" or not nick.strip():
        return 0  # ignora nomes coringa ou vazios

    url = f"https://op.gg/pubg/user/{nick}"
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
                      "AppleWebKit/537.36 (KHTML, like Gecko) "
                      "Chrome/115.0.0.0 Safari/537.36"
    }

    try:
        response = requests.get(url, headers=headers, timeout=10)
        if response.status_code != 200:
            print(f"Erro ao acessar {nick}: HTTP {response.status_code}")
            return None

        soup = BeautifulSoup(response.text, "html.parser")
        kd_div = soup.find("div", class_="recent-matches__stat-value recent-matches__stat-value--good")
        if kd_div:
            kd_str = kd_div.text.strip()
            return float(kd_str.replace(',', '.'))
        else:
            print(f"K/D não encontrado para {nick}")
            return None
    except Exception as e:
        print(f"Erro ao buscar K/D para {nick}: {e}")
        return None

def atualizar_kds():
    import os
    print("Arquivo JSON absoluto:", os.path.abspath(ARQUIVO_JSON))
    with open(ARQUIVO_JSON, "r", encoding="utf-8") as f:
        times = json.load(f)

    for time_data in times:
        print(f"Atualizando time: {time_data['nome']}")
        for jogador in time_data.get("jogadores", []):
            nome = jogador.get("nome")
            if nome and nome != "*":
                print(f" Buscando K/D de {nome}...")
                kd = pegar_kd(nome)
                if kd is not None:
                    jogador["KD"] = kd
                    print(f"  K/D atualizado: {kd}")
                else:
                    print(f"  Não foi possível atualizar K/D de {nome}")
                time.sleep(1)  # evitar bloqueio do site
            else:
                print(f" Ignorando jogador '{nome}'")

    with open(ARQUIVO_JSON, "w", encoding="utf-8") as f:
        json.dump(times, f, ensure_ascii=False, indent=2)

    print("Atualização concluída!")

if __name__ == "__main__":
    atualizar_kds()
