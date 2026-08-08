(function () {
  const req = new Request("http://localhost:5000/user/1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      name: "Robert",
      age: 26,
      role: "Front End Developer",
    }),
  });

  fetch(req)
    .then(async (res) => await res.json())
    .then((data) => console.log(data))
    .catch((error) => console.log(error));
})();
