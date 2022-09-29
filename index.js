const express = require('express');
const app = express();
const jwt = require('jsonwebtoken');

const JWTSecret = 'fecf5580-175a-4199-886c-f1475acca445';


app.set("view engine", "ejs");
app.set("views", "./app/views");

app.use(express.static("./app/public"));

app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// --------------------

const DB = {
    users: [
        {
            id: 1,
            username: 'José',
            password: '2002',
        },
        {
            id: 2,
            username: 'Bianca',
            password: '1234',
        },
        {
            id: 3,
            username: 'Cris',
            password: '54321',
        },
    ]
}

//   ------------------------- AUTH --------------

function auth(req, res, next) {
  req.headers.authorization = "bearer " + tokenHeader;
  const authToken = req.headers["authorization"];

  if (authToken !== undefined) {
    const bearer = authToken.split(" ");
    console.log("BEARER: ", bearer);

    const token = bearer[1];

    jwt.verify(token, JWTSecret, (err, data) => {
      if (err) {
        res.status(401);
        res.json({ message: "Token inválido." });
      } else {
        console.log(data);
        req.token = token;
        req.loggedUser = { id: data.id, username: data.username };
        console.log("USER AUTORIZADO!");
        next();
      }
    });
  } else {
    res.status(401);
    res.json({message: "Realize login para acessar esta rota"});
  }
}

// ----------------- ROTAS ---------------


app.get("/", (req, res) => {
    res.render("index");
});

app.get("/chat", auth, (req, res) => {
    console.log(req.loggedUser);
    res.render("chat");
});

app.get('/users', (req, res) => {
    res.json(DB.users)
});

let tokenHeader = "";
app.post('/auth', (req, res) => {
    const dadosForm = req.body;
    dados = dadosForm;
    const username = dadosForm.username;
    const password = dadosForm.password;
    if (username !== undefined) {
        const user = DB.users.find(u => u.username === username);
        if (user !== undefined) {
            if (user.password === password) {
                jwt.sign({
                    id: user.id,
                    username: user.username
                }, JWTSecret, {
                    expiresIn: '1h'
                }, (err, token) => {
                    if (err) {
                        console.log(err);
                        res.status(400);
                        res.json({ message: 'Ops, não foi possível gerar o token.' })
                    } else {
                        res.status(200);
                        tokenHeader = token;
                        io.emit("msgParaCliente", {
                          username: dadosForm.username,
                          mensagem: "Entrou no chat",
                        });
                        res.redirect("/chat");
                    }
                })
            } else {
                res.status(401);
                res.json({ message: 'Usuário ou senha não coincidem.' });
            }
        } else {
            res.status(404);
            res.json({ message: 'Usuário não existe' });
        }
    } else {
        res.status(400);
        reset.json({ message: 'O campo usuário ou senha não podem ser nulo' })
    }
});



const server = app.listen(5000, () => {
    console.log('servidor rodando: http://localhost:5000');
});


// --------------SOCKET IO-------------------


const io = require("socket.io")(server);
io.on("connection", (socket) => {
    console.log("Entrou na sala.");
  
    socket.on("disconnect", () => {
      console.log("Saiu da sala.");
    });
  
    socket.on('iniciaChat', (data) => {
      console.log('SERVER', data);
      socket.emit('showMessage', data);
      socket.broadcast.emit('showMessage', data);
    });
  });

