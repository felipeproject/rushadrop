import sys
import os
from PyQt5.QtWidgets import QApplication, QMainWindow
from PyQt5.QtWebEngineWidgets import QWebEngineView
from PyQt5.QtCore import QUrl

class WebViewer(QMainWindow):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Visualizador HTML - Overlay")
        self.setGeometry(200, 200, 800, 600)

        self.browser = QWebEngineView()

        # Caminho absoluto para template/overlay.html
        caminho_html = os.path.abspath(os.path.join("template", "overlay.html"))
        self.browser.setUrl(QUrl.fromLocalFile(caminho_html))

        self.setCentralWidget(self.browser)

if __name__ == "__main__":
    app = QApplication(sys.argv)
    janela = WebViewer()
    janela.show()
    sys.exit(app.exec_())
