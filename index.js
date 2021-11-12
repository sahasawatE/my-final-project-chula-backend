const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
const student = require('./Route/student');
const subject = require('./Route/subject');
const teacher = require('./Route/Teacher');
const verify = require('./Route/verifytoken');
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(bodyParser.json());
const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    database: "Learning_Center"
});

app.use('/student',student);
app.use('/subject',subject);
app.use('/teacher',teacher);

app.post('/register', async (req, res) => {
    const userId = req.body.User_id;
    const userPassword = req.body.User_password;
    const user_role = req.body.Role;

    //Hash password
    const salt = await bcrypt.genSalt(10);
    const hashPassword = await bcrypt.hash(userPassword, salt);

    db.query("INSERT INTO Users (User_id,User_password,Role) VALUES (?,?,?)",
        [userId, hashPassword, user_role],
        (err, result) => {
            if (err) {
                console.error(err);
            }
            else {
                res.send("values inserted");
                // res.redirect('/login')
            }
        })
});

app.post('/login', (req, res) => {
    const userId = req.body.User_id;
    const userPassword = req.body.User_password;

    db.query("SELECT * FROM Users WHERE User_id = ?", [userId], async (err, id) => {
        if (err) {
            console.error(err);
        }
        else {
            if(id.length === 0){
                res.send(null)
            }
            else{
                const validatePassword = await bcrypt.compare(userPassword, id[0].User_password);
                if (!validatePassword) {
                    res.send(null);
                }
                else {
                    //create and assign token
                    const token = generateAccessToken(id[0].User_id, id[0].Role);
                    // const refreshToekn = jwt.sign({_id : id[0].Student_id},"hithisishoksahasawat")
                    res.header("auth-token", token).send(token);
                    // res.redirect('/')
                }    
            }
            
        }
    })
})

app.get('/', verify, (req,res) => {
    const id = req.user._id;
    if (req.user.role === 'student') {
        db.query("SELECT * FROM Student WHERE Student_id = ?", [id], (err, result) => {
            if (err) {
                console.error(err);
            }
            else {
                res.send(result);
            }
        })
    }
    else {
        db.query("SELECT * FROM Teacher WHERE Teacher_id = ?", [id], (err, result) => {
            if (err) {
                console.error(err);
            }
            else {
                res.send(result);
            }
        })
    }
});

function generateAccessToken(id,role) {
    return jwt.sign({ _id: id,role:role}, "hithisishok", { expiresIn: "10h" });
}

app.listen('3001', () => {
    console.log('server is running on port 3001')
});