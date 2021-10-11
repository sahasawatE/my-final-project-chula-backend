const mysql = require('mysql');
const express = require('express');
const student = express.Router();
const fileUpload = require('express-fileupload');
const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    database: "Learning_Center"
});

student.use(fileUpload())

student.post('/studentList',(req,res) => {
    const roomId = req.body.Room_id;
    db.query('SELECT * FROM Room WHERE Room_id = ?',[roomId] , (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

student.post('/detail',(req,res) => {
    const studentId = req.body.Student_id;
    db.query("SELECT Student_FirstName, Student_LastName FROM Student WHERE Student_id = ?",[studentId],(err,st) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(st)
        }
    })
})

student.post('/allFiles',(req,res) => {
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;

    db.query('SELECT `File_Path` FROM `Subject_doc` WHERE `Room_id` = ? AND `Subject_id` = ? AND `File_type` = "pdf"',[roomId,subjectId], (err,path) => {
        if(err){
            console.log(err)
        }
        else{
            let docs = [];
            for (let i = 0; i < path.length; i++) {
                docs.push(path[i].File_Path)
            }
            res.send(docs)
        }
    })
})

student.post('/queryTeacher',(req,res) => {
    const roomId = req.body.Room_id;
    db.query('SELECT `Teacher_id` FROM `Room` WHERE `Room_id` = ?',[roomId],(err,tId) => {
        if(err){
            console.log(err)
        }
        else{
            db.query('SELECT * FROM `Teacher` WHERE `Teacher_id` = ?', [tId[0].Teacher_id],(err2,result) => {
                if(err2){
                    console.log(err2)
                }
                else{
                    res.send(result)
                }
            })
        }
    })
})

student.post('/seenNotification',(req,res) => {
    const studentId = req.body.Student_id;
    // const roomId = req.body.Room_id;
    let unreadNoti = [];
    let readNoti = [];
    let newNoti = [];
    db.query('SELECT `unread_noti`,`new_noti`,`read_noti` FROM `Student` WHERE `Student_id` = ?', [studentId], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if(result[0].unread_noti.length === 0){
                unreadNoti = [];
            }
            else{
                result[0].unread_noti.split("[")[1].split("]")[0].split(",").map(v => {
                    unreadNoti.push(parseInt(v))
                }) 
            }

            if (result[0].new_noti.length === 0){
                newNoti = [];
            }
            else{
                result[0].new_noti.split("[")[1].split("]")[0].split(",").map(v => {
                    newNoti.push(parseInt(v))
                })   
                newNoti.filter(e => !unreadNoti.includes(e)).map(v => unreadNoti.push(v))
                db.query('UPDATE `Student` SET `new_noti` = ?, `unread_noti`= ? WHERE `Student_id` = ?', ["", JSON.stringify(unreadNoti), studentId], (err2, result2) => {
                    if (err2) {
                        console.log(err2)
                    }
                }) 
            }
            newNoti = (newNoti.filter(e => !unreadNoti.includes(e)))
            res.send(String(newNoti.length))
        }
    })
})

function uniq(a) {
    var seen = {};
    return a.filter(function (item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

module.exports = student;