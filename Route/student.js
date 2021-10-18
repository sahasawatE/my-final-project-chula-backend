const mysql = require('mysql');
const express = require('express');
const student = express.Router();
const fileUpload = require('express-fileupload');
const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');
const { abort } = require('process');

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
    const data = [];

    db.query('SELECT `Teacher_id` FROM `Subject` WHERE `Subject_id` = ? AND `Room_id` = ?',[subjectId,roomId], (err, teacherId) => {
        if(err){
            console.log(err)
        }
        else{
            db.query('SELECT * FROM `Subject_doc` WHERE `Subject_id` = ? AND `Room_id` = ? AND `Teacher_id` = ?', [subjectId, roomId, teacherId[0].Teacher_id],(err2,id) => {
                if(err2){
                    console.log(err2)
                }
                else{
                    if(id.length !== 0){
                        id.map(v => {
                            data.push({
                                path : v.Folder_path ,
                                fileId : v.files
                            })
                        })
                        res.send(data)
                    }
                    else{
                        res.send('empty')
                    }
                }
            })
        }
    })
})

student.post('/files',async (req,res) => {
    const fileId = req.body.fileId;
    var id = [];
    var files = [];

    if(fileId.length !== 0){
        fileId.split('[')[1].split(']')[0].split(',').map(v => {
            id.push(parseInt(v))
        })
        const queryResults = await Promise.all(
            id.map(async (key) => {
                return new Promise((resolve, reject) =>
                    db.query('SELECT * FROM `file_doc` WHERE `File_Doc_id` = ?', [key], (err, result) => {
                        if (err)
                            return reject(err)
                        else {
                            return resolve(result)
                        }
                    })
                )
            })
        )

        queryResults.map(v => {
            if (v.length !== 0) {
                files.push(v[0])
            }
        })

        res.send(files)
    }
    else{
        res.send('empty')
    }
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