import express from 'express';

const app = express();

app.get('/', (_req, res) => {
  res.json({ name: '@vibecode-starters/express-simple', ok: true });
});

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`Express server listening on http://localhost:${port}`);
});


