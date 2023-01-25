const express = require("express");
const cookieParser = require('cookie-parser')
const app = express();
app.use(cookieParser())
const PORT = 8080; // default port 8080
function generateRandomString() {
  let sequence = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    sequence += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return sequence;
}

function getUserByEmail(givenEmail) {
  for (const user in users) {
    if (givenEmail === users[user].email) {
      return users[user];
    }
  }
  return;
}


app.set("view engine", "ejs");

const users = {
  userRandomID: {
    id: "userRandomID",
    email: "user@example.com",
    password: "123",
  },
  user2RandomID: {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk",
  },
};

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

app.use(express.urlencoded({ extended: true }));

//POST request to /urls it responds with a redirection to /urls/:id.
app.post("/urls", (req, res) => {
  console.log(req.body); // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  
  
  if (!email || !password) {
    return res.send("400 Email or password should not be blank")
  }

  const user = getUserByEmail(email);
  if (!user) {
    return res.status(403).send("User not found")
  }
  if (user.password !== password) {
    return res.status(403).send("Bad password")
  }



  // if (req.body['email'] === "" || req.body['password'] === "") {
  //   res.send("400 Bad Request")
  // }
  // const person = validateUnusedEmail();
  // if (validateUnusedEmail(req.body['email']) !== null) {
  //   res.send("400 Bad Request")
  // }
  res.cookie('user_id', user.id);

  // console.log(req.body.user_id["id"])
  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  res.clearCookie('user_id', req.body["user_id"]);
  res.redirect("/login")
})

app.post("/register", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  if (email === "" || password === "") {
    res.status(400).send("Blank fields")
    return;
  }
  if (getUserByEmail(email)) {
    res.status(400).send("email registered already")
    return;
  }
  const IDRandomizer = "user" + generateRandomString();
  // console.log(IDRandomizer);
  users[IDRandomizer] = {id: IDRandomizer, email: req.body["email"], password: req.body["password"]};
  res.cookie('user_id', IDRandomizer);
  // console.log(users);
  res.redirect("/urls");
})

app.post("/urls/:id/edit", (req, res) => {
  urlDatabase[req.params.id] = req.body.longURL;
  res.redirect("/urls")
})

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls");
})

app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

app.get("/urls", (req, res) => {
  const storeUserId = req.cookies["user_id"];
  const templateVars = { user: users[storeUserId], urls: urlDatabase };
  // console.log(users[storeUserId])
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  const storeUserId = req.cookies["user_id"];
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_login", templateVars)
})

app.get("/register", (req, res) => {
  const storeUserId = req.cookies["user_id"];
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_registration", templateVars)
})

app.get("/urls/new", (req, res) => {
  const storeUserId = req.cookies["user_id"];
  const templateVars = {
    user: users[storeUserId]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  const storeUserId = req.cookies["user_id"];
  const templateVars = {   user: users[storeUserId], id: req.params.id, longURL: urlDatabase[req.params.id] };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  const longURL = urlDatabase[req.params.id];
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});