import tkinter as tk
from tkinter import messagebox
import requests
import os
import json
from dotenv import load_dotenv

load_dotenv()

API_KEY = os.getenv('PUBG_API_KEY')

if not API_KEY:
    raise EnvironmentError("Variável de ambiente 'PUBG_API_KEY' não encontrada.")

HEADERS = {
    'Authorization': f'Bearer {API_KEY}',
    'Accept': 'application/vnd.api+json'
}

def buscar_perfil():
    nick = entrada_nick.get().strip()
    if not nick:
        messagebox.showwarning("Aviso", "Digite o nick do jogador.")
        return

    url_jogador = f"https://api.pubg.com/shards/steam/players?filter[playerNames]={nick}"

    try:
        resposta = requests.get(url_jogador, headers=HEADERS)
        resposta.raise_for_status()
        dados = resposta.json()

        if not dados['data']:
            messagebox.showinfo("Resultado", f"Jogador '{nick}' não encontrado.")
            return

        player = dados['data'][0]
        player_id = player['id']

        url_stats = f"https://api.pubg.com/shards/steam/players/{player_id}/seasons/lifetime"
        resposta_stats = requests.get(url_stats, headers=HEADERS)
        resposta_stats.raise_for_status()
        stats = resposta_stats.json()

        # Exibe JSON formatado completo
        texto_resultado.config(state='normal')
        texto_resultado.delete('1.0', tk.END)
        texto_resultado.insert(tk.END, json.dumps(stats, indent=2, ensure_ascii=False))
        texto_resultado.config(state='disabled')

    except requests.exceptions.RequestException as e:
        messagebox.showerror("Erro", f"Erro ao buscar dados:\n{e}")

janela = tk.Tk()
janela.title("Perfil PUBG - Dados RAW")
janela.geometry("700x600")

tk.Label(janela, text="Digite o nick do jogador:", font=("Arial", 12)).pack(pady=10)
entrada_nick = tk.Entry(janela, width=40, font=("Arial", 12))
entrada_nick.pack()

tk.Button(janela, text="Buscar Perfil", command=buscar_perfil, font=("Arial", 12)).pack(pady=10)

frame_text = tk.Frame(janela)
frame_text.pack(fill='both', expand=True, padx=10, pady=10)

scrollbar = tk.Scrollbar(frame_text)
scrollbar.pack(side='right', fill='y')

texto_resultado = tk.Text(frame_text, wrap='none', font=("Courier", 10), yscrollcommand=scrollbar.set)
texto_resultado.pack(side='left', fill='both', expand=True)

scrollbar.config(command=texto_resultado.yview)

texto_resultado.config(state='disabled')

janela.mainloop()
