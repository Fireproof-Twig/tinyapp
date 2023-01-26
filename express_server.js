//const global section

const express = require("express");
const helpers = require('./helpers');
const cookieSession = require('cookie-session');
const app = express();
const PORT = 8080; // default port 8080
const bcrypt = require("bcryptjs");

//function section

function generateRandomString() {
  let sequence = '';
  let characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let charactersLength = characters.length;
  for (let i = 0; i < 6; i++) {
    sequence += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return sequence;
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

//databases

const users = {
  
};

const urlDatabase = {
  
};

// middleware etc.

app.set("view engine", "ejs");

app.use(cookieSession({
  name: 'session',
  keys: ['key1', 'key2'],
}));

app.use(express.urlencoded({ extended: true }));

///////////////////////////////////////////////////// Routes

//POST request to /urls it responds with a redirection to /urls/:id.
app.post("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("not logged in");
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

// login form
app.post("/login", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const user = helpers.getUserByEmail(email, users);

  
  if (!email || !password) {
    return res.status(403).send("Email and password should not be blank");
  }

  if (!user) {
    return res.status(403).send("User not found");
  }
  if (bcrypt.compareSync(password, user.password) === false) {
    return res.status(403).send("Bad password");
  }

  req.session.user_id = user.id;

  res.redirect("/urls");
});

// logout route
app.post("/logout", (req, res) => {
  req.session = null;
  // res.clearCookie('user_id', req.body["user_id"]);
  res.redirect("/login");
});

// register form for new users
app.post("/register", (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  const hashedPassword = bcrypt.hashSync(password, 10);
  if (email === "" || password === "") {
    res.status(400).send("Blank fields");
    return;
  }
  if (helpers.getUserByEmail(email, users)) {
    res.status(400).send("email registered already");
    return;
  }
  const IDRandomizer = "user" + generateRandomString();
  users[IDRandomizer] = {id: IDRandomizer, email: email, password: hashedPassword};
  req.session.user_id = IDRandomizer;
  res.redirect("/urls");
});

// edit form to change current short url destination
app.post("/urls/:id/edit", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short url does not exist");
  }
  if (!req.session.user_id) {
    return res.send("not logged in");
  }
  const filtered = urlsForUser(req.session.user_id);
  if (!filtered[req.params.id]) {
    return res.send("url does not belong to you.");
  }

  urlDatabase[req.params.id].longURL = req.body.longURL;
  res.redirect("/urls");
});

// delete a current short url
app.post("/urls/:id/delete", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("short url does not exist");
  }
  if (!req.session.user_id) {
    return res.send("not logged in");
  }
  const filtered = urlsForUser(req.session.user_id);
  if (!filtered[req.params.id]) {
    return res.send("url does not belong to you.");
  }

  delete urlDatabase[req.params.id];
  res.redirect("/urls");
});

// say hello if / visited
app.get("/", (req, res) => {
  res.send("Hello!");
});

// show url database as object
app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

// say hello world if /hello visited
app.get("/hello", (req, res) => {
  res.send("<html><body>Hello <b>World</b></body></html>\n");
});

// renders urls database page
app.get("/urls", (req, res) => {
  if (!req.session.user_id) {
    return res.send("not logged in");
  }
  const filtered = urlsForUser(req.session.user_id);

  const storeUserId = req.session.user_id;
  const templateVars = { user: users[storeUserId], urls: filtered };
  res.render("urls_index", templateVars);
});

// renders login form page
app.get("/login", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_login", templateVars);
});

// renders register form page
app.get("/register", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId],
  };
  res.render("urls_registration", templateVars);
});

// renders create new short url form page
app.get("/urls/new", (req, res) => {
  if (!req.session.user_id) {
    return res.redirect("/login");
  }
  const storeUserId = req.session.user_id;
  const templateVars = {
    user: users[storeUserId]
  };
  res.render("urls_new", templateVars);
});

// renders newly created short url page with link to longurl
app.get("/urls/:id", (req, res) => {

  if (!req.session.user_id) {
    return res.send("not logged in");
  }

  const filtered = urlsForUser(req.session.user_id);
  if (!filtered[req.params.id]) {
    return res.send("url does not exist for your account");
  }

  const storeUserId = req.session.user_id;
  const templateVars = {   user: users[storeUserId], id: req.params.id, longURL: urlDatabase[req.params.id].longURL };
  res.render("urls_show", templateVars);
});

// sends user to the longurl using shorturl sequence
app.get("/u/:id", (req, res) => {
  if (!urlDatabase[req.params.id]) {
    return res.send("shortened url does not exist");
  }
  const longURL = urlDatabase[req.params.id].longURL;
  res.redirect(longURL);
});

// connects server
app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});