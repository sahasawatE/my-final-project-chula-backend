const mysql = require('mysql');
const express = require('express');
const student = express.Router();
const fileUpload = require('express-fileupload');
const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');
const { abort } = require('process');

// const db = mysql.createConnection({
//     user: "root",
//     host: "localhost",
//     database: "Learning_Center"
// });

const db = mysql.createConnection({
    user: "tkschool",
    password: 'RLnxY4ykj6Gf3oJ6',
    host: "db-cluster-do-user-8234643-0.b.db.ondigitalocean.com",
    database: "Learning_Center",
    port: 25060,
    ssl: true
    // ssl:{
    //     cert: fs.readFileSync(path.resolve(__dirname,'ca-certificate.crt')).toString()
    // }
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

student.post('/uploadWorkFile/:subjectId/:studentId/:roomId/:workName',(req,res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const subjectId = req.params.subjectId;
    const studentId = req.params.studentId;
    const roomId = req.params.roomId;
    const workName = req.params.workName;

    const file = req.files.file;
    const type = file.mimetype;

    const dir = `/home/tkschool/Files/studentSubmitWork/${subjectId}/${roomId}/${studentId}/${workName}`;

    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true })
    }

    db.query('INSERT INTO `student_submit_work_file`(`File_Path`, `File_type`) VALUES (?,?)', [`${dir}/${file.name}`, type === 'application/pdf' ? 'pdf' : 'image'], (err) => {
        if (err) {
            console.log(err);
        }
        else {
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

student.post('/updateWorkSubmit',(req,res) => {
    const subjectId = req.body.Subject_id;
    const studentId = req.body.Student_id;
    const roomId = req.body.Room_id;
    const workName = req.body.workName;
    const teacherId = req.body.Teacher_id;
    const score = req.body.score;
    const today = new Date();
    var workFileId = [];

    const dir = `/home/tkschool/Files/studentSubmitWork/${subjectId}/${roomId}/${studentId}/${workName}`;

    db.query('SELECT * FROM `Student_Work_Submit` WHERE `Subject_id` = ? AND `Student_id` = ? AND `Room_id` = ? AND `Work_Name` = ?',[subjectId,studentId,roomId,workName], (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            db.query('SELECT * FROM `student_submit_work_file` WHERE `File_Path` LIKE ?',[`${dir}%`],(err2,result2) => {
                if(err2){
                    console.log(err2)
                }
                else{
                    result2.map(v => {
                        workFileId.push(parseInt(v.Submit_File_id))
                    })

                    if (result.length === 0) {
                        db.query('INSERT INTO `Student_Work_Submit`(`Student_id`, `Teacher_id`, `Room_id`, `Subject_id`, `Work_Name`, `Folder_path`, `Score`,`Student_score` , `files`, `Submit_date`, `isSubmit`,`is_Checked`,`comment`) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)',
                            [studentId, teacherId, roomId, subjectId, workName, dir, score,0, JSON.stringify(workFileId),today, 'false','false',''],(err3) => {
                                if(err3){
                                    console.log(err3)
                                }
                                else{
                                    res.send('updated')
                                }
                            })
                    }
                    else{
                        db.query('UPDATE `Student_Work_Submit` SET `files`= ?, `Submit_date` = ? WHERE `Student_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Subject_id` = ? AND `Work_Name` = ? AND `Folder_path` = ?',
                            [workFileId.length === 0 ? '' : JSON.stringify(workFileId), today, studentId, teacherId, roomId, subjectId, workName, dir], (err3) => {
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
        }
    })
})

student.post('/prepareWork',(req,res) => {
    const subjectId = req.body.Subject_id;
    const studentId = req.body.Student_id;
    const roomId = req.body.Room_id;
    const workName = req.body.workName;
    const teacherId = req.body.Teacher_id;
    const score = req.body.score;
    var prepareWorkFileId = [];
    var files = [];

    const dir = `/home/tkschool/Files/studentSubmitWork/${subjectId}/${roomId}/${studentId}/${workName}`;

    db.query('SELECT * FROM `Student_Work_Submit` WHERE `Subject_id` = ? AND `Student_id` = ? AND `Room_id` = ? AND `Work_Name` = ? AND `Folder_path` = ? AND `Teacher_id` = ? AND `Score` = ?', [subjectId, studentId, roomId, workName,dir,teacherId,score],async (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            if(result.length !== 0){
                result[0].files.length !== 0 && result[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                    prepareWorkFileId.push(parseInt(v))
                })
                const queryResults = await Promise.all(
                    prepareWorkFileId.map(async (v) => {

                        return new Promise((resolve, reject) =>
                            db.query('SELECT * FROM `student_submit_work_file` WHERE `Submit_File_id` = ?', [v], (err, result) => {
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
                        v.map(n => files.push(n))
                    }
                })
                res.send(files)
            }
        }
    })
})

student.delete('/deletePrepareWorkFile',(req,res) => {
    const file = req.body.file
    
    db.query('DELETE FROM `student_submit_work_file` WHERE `Submit_File_id` = ?',[file.Submit_File_id],(err) => {
        if(err){
            console.log(err)
        }
        else{
            fs.unlinkSync(file.File_Path);
            res.send('deleted')
        }
    })
})

student.post('/submitwork',(req,res) => {
    const subjectId = req.body.Subject_id;
    const studentId = req.body.Student_id;
    const roomId = req.body.Room_id;
    const workName = req.body.workName;
    const teacherId = req.body.Teacher_id;
    const score = req.body.score;
    const today = new Date();

    db.query('UPDATE `Student_Work_Submit` SET `isSubmit`= ?, `Submit_date` = ? WHERE `Student_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Subject_id` = ? AND `Work_Name` = ? AND `Score` = ?',
    ['true', today,studentId,teacherId,roomId,subjectId,workName,score],(err) => {
        if(err){
            console.log(err)
        }
        else{
            res.send('work send')
        }
    })
})

student.post('/editWork', (req,res) => {
    const subjectId = req.body.Subject_id;
    const studentId = req.body.Student_id;
    const roomId = req.body.Room_id;
    const workName = req.body.workName;
    const teacherId = req.body.Teacher_id;
    const score = req.body.score;

    db.query('UPDATE `Student_Work_Submit` SET `isSubmit`= ? WHERE `Student_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Subject_id` = ? AND `Work_Name` = ? AND `Score` = ?',
        ['false', studentId, teacherId, roomId, subjectId, workName, score], (err) => {
            if (err) {
                console.log(err)
            }
            else {
                res.send('work send')
            }
        })
})

student.post('/allSubject',(req,res) => {
    const roomId = req.body.Room_id;
    var subjects = [];
    var room = [];

    db.query('SELECT * FROM `Subject` WHERE `Room_id` = ?',[roomId],async(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            // res.send(result)
            const data = await Promise.all(
                result.map(async (value) => {
                    return new Promise((resolve, reject) =>
                        db.query('SELECT * FROM `Room` WHERE `Room_id` = ?', [value.Room_id], (err2, result2) => {
                            if (err)
                                return reject(err2)
                            else {
                                return resolve(result2)
                            }
                        })
                    )
                })
            )

            data.map(v => {
                room.push(v)
            })

            result.map(v => {
                subjects.push(v)
            })

            res.send({
                subjects: subjects,
                room: room
            })
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