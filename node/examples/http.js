import http from "http";

function route(request) {
  switch (request.url) {
    case "/":
      return "Bem-Vinde ao Nosso Website!";

    case "/about":
      return "Um Pouco Sobre Nós...";

    default:
      return "Oops!\n\nParece que não Temos a Página que Você Procura.\n\nERRO 404 (Not Found)";
  }
}

const SERVER = http.createServer((request, response) => {
  response.end(route(request));
});

SERVER.listen(2409);
