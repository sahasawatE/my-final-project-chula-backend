const express = require('express');
const cors = require('cors');
const mysql = require('mysql');
const app = express();
var http = require('http').createServer(app);
const student = require('./Route/student');
const subject = require('./Route/subject');
const teacher = require('./Route/Teacher');
const verify = require('./Route/verifytoken');
const bodyParser = require('body-parser');
const bcrypt = require("bcryptjs");
const jwt = require('jsonwebtoken');
const imageToBase64 = require('image-to-base64');

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

var io = require('socket.io')(http, {
    cors: {
        origin: '*',
    }
});

io.use((socket, next) => {
    if (socket.handshake.query && socket.handshake.query.token) {
        jwt.verify(socket.handshake.query.token, "hithisishok", function (err, decoded) {
            if (err) return next(new Error('Authentication error'));
            socket.decoded = decoded;
            next();
        });
    }
    else {
        next(new Error('Authentication error'));
    }
}).on('connection',(socket) => {
    console.log(socket.decoded);
    socket.on('disconnect', () => {
        console.log('user disconnected');
    });
    socket.on('sent-message', (msg) => {
        io.emit('new-message', msg);
        // console.log('new-message' + JSON.stringify(msg))
    });
    socket.on('sent-message-image',async(msg) => {
        const convert2base64 = await Promise.all(
            msg.file.map(v => {
                return new Promise((resolve,reject) => {
                    imageToBase64(v.File_Path) // Path to the image
                        .then(
                            (response) => {
                                return resolve(response); // "cGF0aC90by9maWxlLmpwZw=="
                            }
                        )
                        .catch(
                            (error) => {
                                return reject(error); // Logs an error if there was one
                            }
                        )
                })
            })  
        );
        io.emit('new-message-image', 
            { 
                msg: msg.msg,
                fileData: convert2base64,
                thread: msg.thread,
                subject: msg.subject,
                user: msg.user,
                room: msg.room
            }
        );
    });
})

http.listen('3001', () => {
    console.log('server is running on port 3001')
});