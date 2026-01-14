app.post('/test', (req, res) => {
    console.log(req.body);
    res.json(req.body);
  });
  