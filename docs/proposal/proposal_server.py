import pathlib
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

HTML = (pathlib.Path(__file__).parent / "ResQView-Proposal.html").read_text(encoding="utf-8")


class H(BaseHTTPRequestHandler):
    def log_message(self, *a):
        pass

    def do_GET(self):
        body = HTML.encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


if __name__ == "__main__":
    ThreadingHTTPServer(("127.0.0.1", 8001), H).serve_forever()
