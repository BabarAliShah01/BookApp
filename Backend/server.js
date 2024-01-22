const express = require('express');
const bodyParser = require('body-parser');
const cors=require('cors');
const mysql = require('mysql');
const bcrypt = require('bcrypt');
const Joi=require('joi');
const jwt = require('jsonwebtoken');

const app = express();
const port = 3001;
app.use(cors())
app.use(bodyParser.json());
app.use(express.json())

const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'book_storage',
});

db.connect((err) => {
  if (err) {
    console.error('Sorry! Cannot able to connect');
    return;
  }
  console.log('Connected to MySQL');
});

app.post('/register', async (req, res) => {
   const { name,password,email } = req.body;
    const schema=Joi.object({
     name:Joi.string().min(6).max(50).required(),
     password:Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{5,30}$')),
     email:Joi.string().email().required()
  })
  const message=schema.validate(req.body)  
 if(message.error){
     res.send(message.error.detail[0].message)
 }
 else{
     const select=`SELECT * FROM users WHERE email='${email}'`;
     db.query(select,async(err,results,fields)=>{
     if(err){
       res.send(err)
     }
   else{
     if(results.length>0){
       res.send("Email already registered")
     }
     else{
  const salt=await bcrypt.genSalt(5);
  const hashedPassword = await bcrypt.hash(password, salt);
  const sql=`INSERT INTO users (name, password,email) VALUES ('${name}','${hashedPassword}','${email}')`;
  db.query(sql,(err,results,fields)=>{
  if(err){
   res.status(500).send(err)
  }
  else{
   res.send(results.insertId+" ")
  }
  })
  }
   }
   })
 }
})


 app.post("/login",(req,res)=>{
   const {email,password}=req.body;
 db.query(`SELECT * FROM users WHERE email='${email}'`,async(err,results,fields)=>{
   if(err)
   res.send(err)
   
   else{
     const hash=results[0].password;
     const compare=await bcrypt.compare(password,hash)
     if(compare){
       res.send("Successfully Logged in")
     }
     else{
       res.send("Invalid username or password")
     }
   }
 })
 })

app.get('/api/books', (req, res) => {
   const sql=`Select * from books`;
    db.query(sql,(err,results,fields)=>{
        if(err)
        res.status(500).json({ error: 'Error fetching books' });
        else
        res.json({ books: results });
    });
});

app.get('/search', (req, res) => {
  const tittle = req.query.title;

  db.query('SELECT * FROM books WHERE tittle LIKE ?', [`%${tittle}%`], (err, results) => {
    if (err) {
      res.status(500).json({ error: 'Error searching books' });
    } else {
      res.json({ results });
    }
  });
});

app.post('/insert', (req, res) => {
    const sql=`INSERT INTO books(tittle, author, description) VALUES ('${req.body.tittle}','${req.body.author}','${req.body.description}')`;
    db.query(sql,(err,results,fields)=>{
        if(err)
           console.log('Error'+err)
        else
           res.send(results.insertId+" ")
    })
})

app.delete('/delete', (req, res) => {
  const sql=`DELETE FROM books WHERE id=`+req.query.id;
  db.query(sql,(err,results,fields)=>{
      if(err)
         console.log('Error'+err)
      else
         res.send("Deleted successfilly ")
  })
})


app.listen(port,()=>console.log('Running API on '+port))