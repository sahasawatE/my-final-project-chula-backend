const mysql = require('mysql');
const express = require('express');
const { json } = require('body-parser');
const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');
const subject = express.Router();


const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    database: "Learning_Center"
});

subject.post('/subjectTime',(req,res) => {
    const RoomId = req.body.Room_id;
    db.query('SELECT * FROM SubjectTime WHERE Room_id = ?',[RoomId],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

subject.post('/subjectDetail',(req,res) => {
    const subjectId = req.body.Subject_id;
    const RoomId = req.body.Room_id;
    db.query('SELECT * FROM Subject WHERE Subject_id = ? AND Room_id = ?', [subjectId,RoomId], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            res.send(result)
        }
    })
})

subject.post('/StudentGetNotification',(req,res) => {
    const roomId = req.body.Room_id;
    const studentId = req.body.Student_id;
    db.query('SELECT * FROM `Notification` WHERE `Room_id` = ? AND NOT `Student_id` = ?', [roomId,studentId], (err, noti) => {
        if (err) {
            console.log(err)
        }
        else {
            res.send(noti);
        }
    })
})

subject.post('/pushNotificationFeed',(req,res) => {
    const roomId = req.body.Room_id;
    const noti = req.body.Noti;
    const studentId = req.body.Student_id;
    let unreadNoti = [];
    let readNoti = [];
    let newNoti = [];
    var notiId = [];
    noti.map(v => {
        notiId.push(v.Noti_id)
    })
    if(noti.length === 0){
        db.query('UPDATE `Student` SET `new_noti`= ? , `unread_noti` = ? , `read_noti` = ? WHERE `Room_id` = ? AND `Student_id` = ?', ["","","", roomId, studentId], (err, result) => {
            if (err) {
                console.log(err)
            }
            else {
                res.send(String(newNoti.length))
            }
        })
    }
    else{
        db.query('SELECT `unread_noti`,`new_noti`,`read_noti` FROM `Student` WHERE `Student_id` = ?', [studentId], (err1, result1) => {
            if (err1) {
                console.log(err1)
            }
            else {
                if (result1[0].unread_noti.length === 0) {
                    unreadNoti = [];
                }
                else {
                    result1[0].unread_noti.split("[")[1].split("]")[0].split(",").map(v => {
                        unreadNoti.push(parseInt(v))
                    })
                }

                if (result1[0].new_noti.length === 0) {
                    newNoti = [];
                }
                else {
                    result1[0].new_noti.split("[")[1].split("]")[0].split(",").map(v => {
                        newNoti.push(parseInt(v));
                    })
                }
                newNoti = (notiId.filter(e => !unreadNoti.includes(e)))
                if(notiId.filter(e => unreadNoti.includes(e)).length === 0){
                    db.query('UPDATE `Student` SET `new_noti`= ?,`unread_noti` = ? WHERE `Room_id` = ? AND `Student_id` = ?', [JSON.stringify(newNoti),"", roomId, studentId], (err, result) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            res.send(String(newNoti.length))
                        }
                    })
                }
                else{
                    if(newNoti.length !== 0){
                        db.query('UPDATE `Student` SET `new_noti`= ? WHERE `Room_id` = ? AND `Student_id` = ?', [JSON.stringify(newNoti), roomId, studentId], (err, result) => {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                res.send(String(newNoti.length))
                            }
                        })
                    }    
                }
            }
        })    
    }
})

subject.post('/PostThread',(req,res) => {
    const studentId = req.body.Student_id;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;
    const title = req.body.Title;
    const detail = req.body.Detail;
    const today = new Date();

    if(studentId){
        db.query('INSERT INTO `Thread`( `Student_id`, `Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`,`Time`) VALUES (?,?,?,?,?,?,?,?,?)',
            [studentId, "", subjectId, roomId, "", "", title, detail, today],
            (err, result) => {
                if (err) {
                    console.log(err)
                }
                else {
                    // res.send(result)
                    db.query('INSERT INTO `Notification` (`Noti_Detail`,`Teacher_id`,`Room_id`,`Subject_id`,`Noti_Time`,`Student_id`) VALUES (?,?,?,?,?,?)',[`${studentId} สร้างกระทู้ใหม่`,"",roomId,subjectId,today,studentId],(err2,result2) => {
                        if(err2){
                            console.log(err2)
                        }
                        else{
                            res.send(result)
                        }
                    })
                }
            })
    }
    else{
        db.query('INSERT INTO `Thread`( `Student_id`, `Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`,`Time`) VALUES (?,?,?,?,?,?,?,?,?)',
            ["", teacherId, subjectId, roomId, "", "", title, detail, today],
            (err, result) => {
                if (err) {
                    console.log(err)
                }
                else {
                    // res.send(result)
                    db.query('INSERT INTO `Notification` (`Noti_Detail`,`Teacher_id`,`Room_id`,`Subject_id`,`Noti_Time`,`Student_id`) VALUES (?,?,?,?,?,?)', [`${teacherId} สร้างกระทู้ใหม่`, teacherId, roomId, subjectId, today, ""], (err2, result2) => {
                        if (err2) {
                            console.log(err2)
                        }
                        else {
                            res.send(result)
                        }
                    })
                }
            })
    }
})

subject.post('/Threads',(req,res) => {
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;

    db.query('SELECT * FROM `Thread` WHERE `Subject_id` = ? AND `Room_id` = ?',[subjectId,roomId],(err,threads) => {
        if(err){
            console.log(err)
        }
        else{
            // res.send(threads)
            var quastion = [];
            var reply = [];
            for(let i = 0; i < threads.length; i++){
                if(threads[i].Reply_to !== ''){
                    reply.push(threads[i])
                }
                else{
                    quastion.push(threads[i])
                }
            }

            res.send([quastion,reply])
        }
    })
})

subject.post('/ReplyThread',(req,res) => {
    const studentId = req.body.Student_id;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    const replyTo = req.body.Reply_to;
    const detail = req.body.Detail;
    const roomId = req.body.Room_id;
    const today = new Date();

    if(studentId){
        // console.log(threadId, studentId, subjectId, replyTo, detail,roomId)
        db.query('INSERT INTO `Thread`( `Student_id`,`Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`,`Time`) VALUES (?,?,?,?,?,?,?,?,?)',[studentId,"",subjectId,roomId,replyTo,'','',detail,today],(err) => {
            if(err){
                console.log(err)
            }
            else{
                db.query('INSERT INTO `Notification` (`Noti_Detail`,`Teacher_id`,`Room_id`,`Subject_id`,`Noti_Time`,`Student_id`) VALUES (?,?,?,?,?,?)', [`${studentId} ตอบกระทู้`, "", roomId, subjectId, today, studentId], (err2, result2) => {
                    if (err2) {
                        console.log(err2)
                    }
                    else {
                        res.send('posted')
                    }
                })
            }
        })
    }
    else if(teacherId){
        // console.log(threadId, teacherId, subjectId, replyTo, detail,roomId)
        db.query('INSERT INTO `Thread`( `Student_id`,`Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`,`Time`) VALUES (?,?,?,?,?,?,?,?,?)',["",teacherId,subjectId,roomId,replyTo,'','',detail,today],(err) => {
            if(err){
                console.log(err)
            }
            else{
                db.query('INSERT INTO `Notification` (`Noti_Detail`,`Teacher_id`,`Room_id`,`Subject_id`,`Noti_Time`,`Student_id`) VALUES (?,?,?,?,?,?)', [`${teacherId} ตอบกระทู้`, teacherId, roomId, subjectId, today, ""], (err2, result2) => {
                    if (err2) {
                        console.log(err2)
                    }
                    else {
                        res.send('posted')
                    }
                })
            }
        })
    }
})

subject.post('/TeacherGetNotification', async(req,res) => {
    const subjects = req.body.subjects;
    var noti = [];
    const queryResults = await Promise.all(
        subjects.map(async (key) => {
            const room = key.Room_id;
            const subject = key.Subject_id;

            return new Promise((resolve, reject) =>
                db.query('SELECT * FROM `Notification` WHERE `Room_id` = ? AND `Subject_id` = ? AND `Teacher_id` = ?', [room, subject,""], (err, result) => {
                    if (err)
                        return reject(err)
                    else{
                        return resolve(result)
                    }
                })
            )
        })
    )
    queryResults.map(v => {
        if(v.length !== 0){
            v.map(n => noti.push(n))
        }
    })
    res.send(noti)
})

subject.post('/teacherPushNotificationFeed',(req,res) => {
    const noti = req.body.noti;
    const teacherId = req.body.Teacher_id;
    let unreadNoti = [];
    let readNoti = [];
    let newNoti = [];
    var notiId = [];
    

    noti.map(v => {
        notiId.push(v.Noti_id)
    })

    if (noti.length === 0) {
        db.query('UPDATE `Teacher` SET `new_noti`= ? , `unread_noti` = ? , `read_noti` = ? WHERE `Teacher_id` = ?', ["", "", "", teacherId], (err, result) => {
            if (err) {
                console.log(err)
            }
            else {
                res.send(String(newNoti.length))
            }
        })
    } 
    else {
        db.query('SELECT `unread_noti`,`new_noti`,`read_noti` FROM `Teacher` WHERE `Teacher_id` = ?', [teacherId], (err1, result1) => {
            if (err1) {
                console.log(err1)
            }
            else {
                if (result1[0].unread_noti.length === 0) {
                    unreadNoti = [];
                }
                else {
                    result1[0].unread_noti.split("[")[1].split("]")[0].split(",").map(v => {
                        unreadNoti.push(parseInt(v))
                    })
                }

                if (result1[0].new_noti.length === 0) {
                    newNoti = [];
                }
                else {
                    result1[0].new_noti.split("[")[1].split("]")[0].split(",").map(v => {
                        newNoti.push(parseInt(v));
                    })
                }
                newNoti = (notiId.filter(e => !unreadNoti.includes(e)))
                if (notiId.filter(e => unreadNoti.includes(e)).length === 0) {
                    db.query('UPDATE `Teacher` SET `new_noti`= ?,`unread_noti` = ? WHERE `Teacher_id` = ?', [JSON.stringify(newNoti), "", teacherId], (err, result) => {
                        if (err) {
                            console.log(err)
                        }
                        else {
                            res.send(String(newNoti.length))
                        }
                    })
                }
                else {
                    if (newNoti.length !== 0) {
                        db.query('UPDATE `Teacher` SET `new_noti`= ? WHERE `Teacher_id` = ?', [JSON.stringify(newNoti), teacherId], (err, result) => {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                res.send(String(newNoti.length))
                            }
                        })
                    }
                }
            }
        })
    }
})

subject.post('/studentWorks',(req,res) => {
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;

    db.query('SELECT * FROM `Subject_Work` WHERE `Subject_id` = ? AND `Room_id` = ?',[subjectId,roomId],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

subject.post('/allWorkFiles',async (req,res) => {
    const filePath = req.body.File_Path;
    var workFiles = [];

    if(filePath.length !== 0){
        const queryResults = await Promise.all(
            filePath.split('[')[1].split(']')[0].split(',').map(async (key) => {
                const id = parseInt(key);

                return new Promise((resolve, reject) =>
                    db.query('SELECT * FROM `file_work` WHERE `Work_File_id` = ?', [id], (err, result) => {
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
                workFiles.push(v[0])
            }
        })
    }

    res.send(workFiles)
})

subject.post('/file', (req, res) => {
    const path = req.body.path;
    const type = req.body.type;
    if(type === 'pdf'){
        pdf2base64(path)
            .then(
                (result) => {
                    res.send(result); //cGF0aC90by9maWxlLmpwZw==
                }
            )
            .catch(
                (error) => {
                    console.log(error); //Exepection error....
                }
            )
    }
    else if(type === 'image'){
        var imageAsBase64 = fs.readFileSync(path, 'base64');
        res.send(imageAsBase64)
    }
})

subject.post('/docCreateFolder',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const folderName = req.body.FolderName;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}`

    if(folderName === 'noFolder'){
        if (!fs.existsSync(`${dir}/${folderName}`)) {
            db.query('INSERT INTO `Subject_doc`(`Subject_id`, `Teacher_id`, `Folder_path`, `Room_id`, `files`) VALUES (?,?,?,?,?)',
                [subjectId, teacherId, `${dir}/${folderName}`, roomId, ''], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.mkdirSync(`${dir}/${folderName}`, { recursive: true })
                        res.send('file uploaded')
                    }
                })
        }
        else {
            res.send('fuck got bug')
        }
    }
    else{
        if (!fs.existsSync(`${dir}/${folderName}`)) {
            db.query('INSERT INTO `Subject_doc`(`Subject_id`, `Teacher_id`, `Folder_path`, `Room_id`, `files`) VALUES (?,?,?,?,?)',
                [subjectId, teacherId, `${dir}/${folderName}`, roomId, ''], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.mkdirSync(`${dir}/${folderName}`, { recursive: true })
                        res.send('folder created')
                    }
                })
        }
        else {
            res.send('This folder name is already used.')
        }
    }
})

subject.post('/inFolder',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const folders = req.body.folders;
    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}`;

    var fileId = [];
    var Files = [];

    if(fs.existsSync(`${dir}/${folders}`)){
        db.query('SELECT `files` FROM `Subject_doc` WHERE `Folder_path` = ?', [`${dir}/${folders}`], async (err,files) => {
            if(err){
                console.log(err)
            }
            else{
                if (files[0].files.length !== 0){
                    files[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                        fileId.push(parseInt(v))
                    })
                }

                const queryResults = await Promise.all(
                    fileId.map(async (key) => {
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
                        Files.push(v[0])
                    }
                })
                res.send(Files)
            }
        })
    }
    else{
        res.send('This path does not exits.')
    }
})

module.exports = subject;