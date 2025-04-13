import fastify from "fastify";

const app = fastify()

app.get('/', () => {
  return 'Hello, world!'
})

app.listen({ port: 3333 }).then(() => {
  console.log(`HTTP running 🔥 at http://localhost:3333`)
})