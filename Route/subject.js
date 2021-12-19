const mysql = require('mysql');
const express = require('express');
const pdf2base64 = require('pdf-to-base64');
const imageToBase64 = require('image-to-base64');
const fileUpload = require('express-fileupload');
const fs = require('fs');
const subject = express.Router();

subject.use(fileUpload())

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
    const fileList = req.body.fileList;
    const today = new Date();

    if(studentId){
        db.query('INSERT INTO `Thread`( `Student_id`, `Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`,`Time`) VALUES (?,?,?,?,?,?,?,?,?)',
            [studentId, "", subjectId, roomId, "", fileList === '[]' ? "" : fileList, title, detail, today],
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
            ["", teacherId, subjectId, roomId, "", fileList === '[]' ? "" : fileList, title, detail, today],
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
        imageToBase64(path) // Path to the image
            .then(
                (response) => {
                    res.send(response); // "cGF0aC90by9maWxlLmpwZw=="
                }
            )
            .catch(
                (error) => {
                    console.log(error); // Logs an error if there was one
                }
            )
    }
})

subject.post('/docCreateFolder',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const folderName = req.body.FolderName;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}`

    if(folderName === 'noFolder'){
        db.query('SELECT `Folder_path` FROM `Subject_doc` WHERE `Folder_path` = ?',[`${dir}/${folderName}`],(err,fn) => {
            if(err){
                console.log(err)
            }
            else{
                if(fn.length === 0){
                    db.query('INSERT INTO `Subject_doc`(`Subject_id`, `Teacher_id`, `Folder_path`, `Room_id`, `files`) VALUES (?,?,?,?,?)',
                        [subjectId, teacherId, `${dir}/${folderName}`, roomId, ''], (err, result) => {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                res.send('file uploaded')
                            }
                        })
                }
                else{
                    res.send('ok')
                }
            }
        })
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

subject.post('/clipCreateFolder', (req, res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const folderName = req.body.FolderName;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/TeacherUploadClip/${subjectId}/${teacherId}/${roomId}`

    if (folderName === 'noFolder') {
        db.query('SELECT `Folder_path` FROM `Subject_clip` WHERE `Folder_path` = ?', [`${dir}/${folderName}`], (err, fn) => {
            if (err) {
                console.log(err)
            }
            else {
                if (fn.length === 0) {
                    db.query('INSERT INTO `Subject_clip`(`Subject_id`, `Teacher_id`, `Folder_path`, `Room_id`, `files`) VALUES (?,?,?,?,?)',
                        [subjectId, teacherId, `${dir}/${folderName}`, roomId, ''], (err, result) => {
                            if (err) {
                                console.log(err)
                            }
                            else {
                                res.send('file uploaded')
                            }
                        })
                }
                else {
                    res.send('ok')
                }
            }
        })
    }
    else {
        if (!fs.existsSync(`${dir}/${folderName}`)) {
            db.query('INSERT INTO `Subject_clip`(`Subject_id`, `Teacher_id`, `Folder_path`, `Room_id`, `files`) VALUES (?,?,?,?,?)',
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

subject.post('/uploadDocNoti',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const today = new Date();
    const folderName = req.body.FolderName;

    db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)', [folderName.length === 0 ? "อัพโหลดเอกสาร" : `อัพโหลดเอกสารใน ${folderName}`, teacherId, roomId, subjectId, today, ""], (err2, result2) => {
        if (err2) {
            console.log(err2)
        }
        else {
            res.send('upload doc done')
        }
    })
})

subject.post('/uploadClipNoti', (req, res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const today = new Date();
    const folderName = req.body.FolderName;

    db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)', [folderName === 'noFolder' ? "อัพโหลดคลิป" : `อัพโหลดคลิปใน ${folderName}`, teacherId, roomId, subjectId, today, ""], (err2, result2) => {
        if (err2) {
            console.log(err2)
        }
        else {
            res.send('upload doc done')
        }
    })
})

subject.post('/uploadWorkNoti', (req, res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const today = new Date();

    db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)', ['เพิ่มงานใหม่', teacherId, roomId, subjectId, today, ""], (err2, result2) => {
        if (err2) {
            console.log(err2)
        }
        else {
            res.send('upload doc done')
        }
    })
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
                if(files.length !== 0){
                    if (files[0].files.length !== 0) {
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
            }
        })
    }
    else{
        res.send('This path does not exits.')
    }
})

subject.post('/enterClipFolder', (req, res) => {
    const path = req.body.path

    var fileId = [];
    var Files = [];

    if (fs.existsSync(path)) {
        db.query('SELECT `files` FROM `Subject_clip` WHERE `Folder_path` = ?', [path], async (err, files) => {
            if (err) {
                console.log(err)
            }
            else {
                if (files.length !== 0) {
                    if (files[0].files.length !== 0) {
                        files[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                            fileId.push(parseInt(v))
                        })
                    }

                    const queryResults = await Promise.all(
                        fileId.map(async (key) => {
                            return new Promise((resolve, reject) =>
                                db.query('SELECT * FROM `file_clip` WHERE `File_Clip_id` = ?', [key], (err, result) => {
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
            }
        })
    }
    else {
        res.send('This path does not exits.')
    }
})

subject.post('/inClipFolder', (req, res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const folders = req.body.folders;
    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/TeacherUploadClip/${subjectId}/${teacherId}/${roomId}`;

    var fileId = [];
    var Files = [];

    if (fs.existsSync(`${dir}/${folders}`)) {
        db.query('SELECT `files` FROM `Subject_clip` WHERE `Folder_path` = ?', [`${dir}/${folders}`], async (err, files) => {
            if (err) {
                console.log(err)
            }
            else {
                if (files.length !== 0) {
                    if (files[0].files.length !== 0) {
                        files[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                            fileId.push(parseInt(v))
                        })
                    }

                    const queryResults = await Promise.all(
                        fileId.map(async (key) => {
                            return new Promise((resolve, reject) =>
                                db.query('SELECT * FROM `file_clip` WHERE `File_Clip_id` = ?', [key], (err, result) => {
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
            }
        })
    }
    else {
        res.send('This path does not exits.')
    }
})

subject.delete('/CancelFiles',(req,res) => {
    const path = req.body.path;
    const fileName = req.body.name;
    const dir = `${path}/${fileName}`;
    var fileId = [];
    var deleteFileId;

    db.query('SELECT * FROM `file_doc` WHERE `File_Path` LIKE ?', [`${path}%`], (err2, result2) => {
        if (err2) {
            console.log(err2)
        }
        else {
            result2.map(v => {
                if(v.File_Path !== dir){
                    fileId.push(v.File_Doc_id)
                }
                else{
                    deleteFileId = v.File_Doc_id
                }
            })
            db.query('DELETE FROM `file_doc` WHERE `File_Path` = ? AND `File_Doc_id` = ?', [dir, parseInt(deleteFileId)], (err4) => {
                if (err4) {
                    console.log(err4)
                }
                else {
                    fs.unlinkSync(dir);
                    res.send('file is deleted')
                }
            })
        }
    })
})

subject.post('/updateFileList',(req,res) => {
    const path = req.body.path;
    var fileId = [];

    db.query('SELECT * FROM `file_doc` WHERE `File_Path` LIKE ?', [`${path}%`],(err,result) => {
        if(err){
            console.log(err);
        }
        else{
            result.map(v => {
                fileId.push(v.File_Doc_id)
            })
            if(fileId.length === 0){
                db.query('UPDATE `Subject_doc` SET `files` = ? WHERE `Folder_path` = ?', ['', path], (err3) => {
                    if (err3) {
                        console.log(err3)
                    }
                    else {
                        res.send('updated')
                    }
                })
            }
            else{
                db.query('UPDATE `Subject_doc` SET `files` = ? WHERE `Folder_path` = ?', [JSON.stringify(fileId), path], (err3) => {
                    if (err3) {
                        console.log(err3)
                    }
                    else {
                        res.send('updated')
                    }
                })
            }
        }
    })
})

subject.delete('/CancelFolder',(req,res) => {
    const path = req.body.path;
    var fileId = [];
    db.query('SELECT * FROM `Subject_doc` WHERE `Folder_path` = ?',[path], (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            if (result[0].files.length !== 0){
                result[0].files.split('[')[1].split(']')[0].split(',').map(v => fileId.push(parseInt(v)))
                db.query('DELETE FROM `Subject_doc` WHERE `Folder_path` = ?', [path], async(err) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        await Promise.all(
                            fileId.map(async id => {
                                return new Promise((resolve, reject) =>
                                    db.query('DELETE FROM `file_doc` WHERE `File_Doc_id` = ?', [id], (err, result) => {
                                        if (err)
                                            return reject(err)
                                        else {
                                            return resolve(result)
                                        }
                                    })
                                )
                            })
                        )
                        fs.rmdirSync(path, { recursive: true });
                        res.send('file is deleted')
                    }
                })
            }
            else{
                db.query('DELETE FROM `Subject_doc` WHERE `Folder_path` = ?', [path], (err) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.rmdirSync(path, { recursive: true });
                        res.send('folder is deleted')
                    }
                })
            }
        }
    })
})

subject.delete('/CancelClipFolder', (req, res) => {
    const path = req.body.path;
    var fileId = [];
    db.query('SELECT * FROM `Subject_clip` WHERE `Folder_path` = ?', [path], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result[0].files.length !== 0) {
                result[0].files.split('[')[1].split(']')[0].split(',').map(v => fileId.push(parseInt(v)))
                db.query('DELETE FROM `Subject_clip` WHERE `Folder_path` = ?', [path], async (err) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        await Promise.all(
                            fileId.map(async id => {
                                return new Promise((resolve, reject) =>
                                    db.query('DELETE FROM `file_clip` WHERE `File_Clip_id` = ?', [id], (err, result) => {
                                        if (err)
                                            return reject(err)
                                        else {
                                            return resolve(result)
                                        }
                                    })
                                )
                            })
                        )
                        fs.rmdirSync(path, { recursive: true });
                        res.send('file is deleted')
                    }
                })
            }
            else {
                db.query('DELETE FROM `Subject_clip` WHERE `Folder_path` = ?', [path], (err) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.rmdirSync(path, { recursive: true });
                        res.send('folder is deleted')
                    }
                })
            }
        }
    })
})

subject.delete('/CancelClipFiles', (req, res) => {
    const path = req.body.path;
    const fileName = req.body.name;
    const dir = `${path}/${fileName}`;
    var fileId = [];
    var deleteFileId;

    db.query('SELECT * FROM `file_clip` WHERE `File_Path` LIKE ?', [`${path}%`], (err2, result2) => {
        if (err2) {
            console.log(err2)
        }
        else {
            result2.map(v => {
                if (v.File_Path !== dir) {
                    fileId.push(v.File_Clip_id)
                }
                else {
                    deleteFileId = v.File_Clip_id
                }
            })
            db.query('DELETE FROM `file_clip` WHERE `File_Path` = ? AND `File_Clip_id` = ?', [dir, parseInt(deleteFileId)], (err4) => {
                if (err4) {
                    console.log(err4)
                }
                else {
                    fs.unlinkSync(dir);
                    res.send('file is deleted')
                }
            })
        }
    })
})

subject.post('/updateCLipList', (req, res) => {
    const path = req.body.path;
    var fileId = [];

    db.query('SELECT * FROM `file_clip` WHERE `File_Path` LIKE ?', [`${path}%`], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            result.map(v => {
                fileId.push(v.File_Clip_id)
            })
            if (fileId.length === 0) {
                db.query('UPDATE `Subject_clip` SET `files` = ? WHERE `Folder_path` = ?', ['', path], (err3) => {
                    if (err3) {
                        console.log(err3)
                    }
                    else {
                        res.send('updated')
                    }
                })
            }
            else {
                db.query('UPDATE `Subject_clip` SET `files` = ? WHERE `Folder_path` = ?', [JSON.stringify(fileId), path], (err3) => {
                    if (err3) {
                        console.log(err3)
                    }
                    else {
                        res.send('updated')
                    }
                })
            }
        }
    })
})

subject.post('/checkStatusWork',(req,res) => {
    const selectWork = req.body.selectWork;
    const studentId = req.body.Student_id
    db.query('SELECT `isSubmit` FROM `Student_Work_Submit` WHERE `Student_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Subject_id` = ? AND `Work_Name` = ? AND `Score` = ?',
        [studentId, selectWork.Teacher_id, selectWork.Room_id, selectWork.Subject_id, selectWork.Work_Name, selectWork.Score],(err,result) => {
            if(err){
                console.log(err)
            }
            else{
                if(result.length === 0){
                    res.send('false')
                }
                else{
                    res.send(result[0].isSubmit)
                }
            }
        })
})

subject.post('/fileThread/:roomId/:subjectId/:userId/:reply',(req,res) => {
    const file = req.files.file;
    const roomId = req.params.roomId;
    const subjectId = req.params.subjectId;
    const userId = req.params.userId;
    const reply = req.params.reply;
    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}/${reply}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    db.query('INSERT INTO `file_thread`(`File_Path`, `File_type`) VALUES (?,?)', [`${dir}/${file.name}`, file.mimetype], (err3) => {
        if (err3) {
            console.log(err3);
        }
        else {
            // res.status(200).send('Data inserted.')
            file.mv(`${dir}/${file.name}`, err3 => {
                if (err3) {
                    return res.status(500).send(err3)
                }
                else {
                    res.json({ fileName: file.name, filePath: dir })
                }
            })
        }
    })
})

subject.post('/fileThread/:roomId/:subjectId/:userId', (req, res) => {
    const file = req.files.file;
    const roomId = req.params.roomId;
    const subjectId = req.params.subjectId;
    const userId = req.params.userId;
    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    db.query('INSERT INTO `file_thread`(`File_Path`, `File_type`) VALUES (?,?)', [`${dir}/${file.name}`, file.mimetype], (err3) => {
        if (err3) {
            console.log(err3);
        }
        else {
            // res.status(200).send('Data inserted.')
            file.mv(`${dir}/${file.name}`, err3 => {
                if (err3) {
                    return res.status(500).send(err3)
                }
                else {
                    res.json({ fileName: file.name, filePath: dir })
                }
            })
        }
    })
})

subject.delete('/fileThread',(req,res) => {
    const name = req.body.name;
    const subjectId = req.body.subjectId;
    const roomId = req.body.roomId;
    const userId = req.body.userId;
    const threadId = req.body.threadId;
    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}/${threadId}`;
    // console.log(`${dir}/${name}`)
    // res.send('delete')

    db.query('DELETE FROM `file_thread` WHERE `File_Path` = ? ', [`${dir}/${name}`], (err4) => {
        if (err4) {
            console.log(err4)
        }
        else {
            fs.unlinkSync(`${dir}/${name}`);
            res.send('file is deleted')
        }
    })
})

subject.post('/fileThreadId',(req,res) => {
    const roomId = req.body.roomId;
    const subjectId = req.body.subjectId;
    const userId = req.body.userId;
    const reply = req.body.reply;
    const name = req.body.name;
    const dir = reply.length === 0 ? `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}` : `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}/${reply}`;
    var id = [];


    db.query('SELECT * FROM `file_thread` WHERE `File_Path` = ?' ,[`${dir}/${name}`], (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            if(result.length !== 0){
                result.map(v => {
                    id.push(v)
                })
            }
            res.send(id)
        }
    })
})

subject.post('/postThreadImg',(req,res) => {
    const files = req.body.file;
    const ans = req.body.ans;
    var fileName = [];
    var fileId = []
    var roomId;
    var subjectId;
    var userId;
    var reply;
    files.map(v => {
        roomId = v.File_Path.split('/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/')[1].split('/')[0];
        subjectId = v.File_Path.split('/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/')[1].split('/')[1];
        userId = v.File_Path.split('/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/')[1].split('/')[2];
        reply = v.File_Path.split('/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/')[1].split('/')[3];
        fileName.push(v.File_Path.split('/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/')[1].split('/')[4])
        fileId.push(v.File_Thread_id);
    })

    db.query('INSERT INTO `Thread` (`Student_id`, `Teacher_id`, `Subject_id`, `Room_id`, `Reply_to`, `Example_file`, `Title`, `Detail`, `Time`) VALUES (?,?,?,?,?,?,?,?,?)',
    [userId[0] === 's' ? userId : '', userId[0] === 't' ? userId : '', subjectId, roomId, reply, JSON.stringify(fileId), '', ans, new Date()],(err) => {
        if(err){
            console.log(err)
        }
        else{
            db.query(' SELECT * FROM `Thread` WHERE `Example_file` = ?', [JSON.stringify(fileId)], async(err2,result) => {
                if(err2){
                    console.log(err2)
                }
                else{
                    await Promise.all(
                        fileName.map(async(v, i) => {
                            const oldDir = files[i].File_Path;
                            const newDir = `/Users/yen/Desktop/FinalProject/component/final/src/components/ThreadFile/${roomId}/${subjectId}/${userId}/${reply}/${result[0].Thread_id}`;

                            if (!fs.existsSync(newDir)) {
                                fs.mkdirSync(newDir, { recursive: true })
                            }

                            fs.rename(oldDir, `${newDir}/${v}`, function (errM) {
                                if(errM){
                                    console.log(errM)
                                }
                                else{
                                    return new Promise((resolve, reject) => {
                                        db.query('UPDATE `file_thread` SET `File_Path`= ? WHERE `File_Thread_id` = ?', [`${newDir}/${v}`, files[i].File_Thread_id],(err3,result3) => {
                                            if(err3){
                                                return reject(err3)
                                            }
                                            else{
                                                return resolve(result3)
                                            }
                                        })
                                    })
                                }
                            })
                        })
                    )

                    res.send('send')
                }
            })
        }
    })
})

subject.post('/img',async(req,res) => {
    const id = req.body.id;
    var path = [];

    if(id){
        const queryPath = await Promise.all(
            id.map(async (v) => {
                return new Promise((resolve, reject) => {
                    db.query('SELECT * FROM `file_thread` WHERE `File_Thread_id` = ?', [v], (err, result) => {
                        if (err) {
                            return reject(err)
                        }
                        else {
                            return resolve(result)
                        }
                    })
                })
            })
        )

        queryPath.map((v) => {
            path.push(v[0].File_Path)
        })
    }

    res.send(path)
})

subject.delete('/cancelReplyImg',(req,res) => {
    const fileList = req.body.fileList;

    Promise.all(
        fileList.map(async(v) => {
            return new Promise((resolve, reject) => {
                db.query('DELETE FROM `file_thread` WHERE `File_Thread_id` = ? AND `File_Path` = ? AND `File_type` = ? ',[v.File_Thread_id,v.File_Path,v.File_type],(err) => {
                    if(err){
                        return reject(err)
                    }
                    else{
                        fs.unlinkSync(v.File_Path);
                        return resolve('file is deleted')
                    }
                })
            })
        })
    )

    res.send('canceled')
})

module.exports = subject;