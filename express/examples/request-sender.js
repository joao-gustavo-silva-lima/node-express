(function () {
  const req = new Request("http://localhost:5000/user", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Mario",
      age: 23,
      role: "Back End Developer",
    }),
  });

  fetch(req)
    .then(async (res) => await res.json())
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
})();
