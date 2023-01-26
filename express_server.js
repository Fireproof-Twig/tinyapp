const express = require("express");
// const cookieParser = require('cookie-parser')
const cookieSession = require('cookie-session')
const app = express();
// app.use(cookieParser());
app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}))
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");
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

function urlsForUser(id) {
  const newObject = {};
  for (const shortURL in urlDatabase) {
    if (urlDatabase[shortURL].userID === id) {
      newObject[shortURL] = urlDatabase[shortURL];
    }
  }
  return newObject;
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
  b6UTxQ: {
    longURL: "https://www.tsn.ca",
    userID: "userRandomID",
  },
  i3BoGr: {
    longURL: "https://www.google.ca",
    userID: "user2RandomID",
  },
};

// const urlDatabase = {
//   "b2xVn2": "http://www.lighthouselabs.ca",
//   "9sm5xK": "http://www.google.com"
// };

app.use(express.urlencoded({ extended: true }));

//POST request to /urls it responds with a redirection to /urls/:id.
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("not logged in")
  }

  console.log(req.body); // Log the POST request body to the console
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    longURL: "placeholder",
    userID: req.session.user_id
  };
  urlDatabase[shortURL].longURL = req.body.longURL;
  res.redirect(`/urls/${shortURL}`); // Respond with 'Ok' (we will replace this)
});

app.post("/login", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const user = getUserByEmail(email);

  
  if (!email || !password) {
    return res.status(403).send("Email and password should not be blank")
  }

  if (!user) {
    return res.status(403).send("User not found")
  }
  if (bcrypt.compareSync(password, user.password) === false) {
    return res.status(403).send("Bad password")
  }

  req.session.user_id = user.id;

  res.redirect("/urls")
})

app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('user_id', req.body["user_id"]);
  res.redirect("/login")
})

app.post("/register", (req, res) => {
  const email = req.body.email
  const password = req.body.password
  const hashedPassword = bcrypt.hashSync(password, 10)
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
  users[IDRandomizer] = {id: IDRandomizer, email: email, password: hashedPassword};
  req.session.user_id = IDRandomizer;
  console.log(users);
  res.redirect("/urls");
})

app.post("/urls/:id/edit", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short url does not exist")
  }
  if (!req.session.user_id) {
    return res.send("not logged in")
  }
  const filtered = urlsForUser(req.session.user_id);
  if (!filtered[req.params.id]) {
   return res.send("url does not belong to you.")
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls")
})

app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short url does not exist")
  }
  if (!req.session.user_id) {
    return res.send("not logged in")
  }
  const filtered = urlsForUser(req.session.user_id);
  if (!filtered[req.params.id]) {
   return res.send("url does not belong to you.")
  }

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
  if (!req.session.user_id) {
    return res.send("not logged in")
  }
  const filtered = urlsForUser(req.session.user_id);

  const storeUserId = req.session.user_id;
  const templateVars = { user: users[storeUserId], urls: filtered };
  // console.log(users[storeUserId])
  res.render("urls_index", templateVars);
});

app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls")
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_login", templateVars)
})

app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls")
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_registration", templateVars)
})

app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
   return res.redirect("/login")
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId]
  };
  res.render("urls_new", templateVars);
});

app.get("/urls/:id", (req, res) => {
  if (!req.session.user_id) {
    return res.send("not logged in")
   };
   const filtered = urlsForUser(req.session.user_id);
   if (!filtered[req.params.id]) {
    return res.send("url does not belong to you.")
   }
  const storeUserId = req.session.user_id;
  const templateVars = {   user: users[storeUserId], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
     return res.send("shortened url does not exist")
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});