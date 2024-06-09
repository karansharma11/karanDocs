const mongoose = require('mongoose')
const Document = require('./Document')
const dbURI =
  'mongodb+srv://amazona:LvuM4VszzuQrNTNa@cluster0.a8j6qz9.mongodb.net/karanDocs?retryWrites=true&w=majority&appName=Cluster0'
mongoose
  .connect(dbURI, {
    autoIndex: true, // Make this also true
  })
  .then(() => {
    console.log('Connected to the database')
  })
  .catch((err) => {
    console.error(err.message)
  })

const io = require('socket.io')(3001, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

const defaultValue = ''

io.on('connection', (socket) => {
  socket.on('get-document', async (documentId) => {
    const document = await findOrCreateDocument(documentId)
    socket.join(documentId)
    socket.emit('load-document', document.data)

    socket.on('send-changes', (delta) => {
      socket.broadcast.to(documentId).emit('receive-changes', delta)
    })

    socket.on('save-document', async (data) => {
      await Document.findByIdAndUpdate(documentId, { data })
    })
  })
})

async function findOrCreateDocument(id) {
  if (id == null) return

  const document = await Document.findById(id)
  if (document) return document
  return await Document.create({ _id: id, data: defaultValue })
}
