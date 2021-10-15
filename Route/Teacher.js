const express = require('express');
const teacher = express.Router()
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const pdf2base64 = require('pdf-to-base64');
const fs = require('fs');
// const { EBADF } = require('constants');

const db = mysql.createConnection({
    user: 'root',
    host: 'localhost',
    database: "Learning_Center"
});

teacher.use(fileUpload());

teacher.post('/subject',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    db.query("SELECT * FROM Subject WHERE Teacher_id = ? AND Room_id = ? AND Subject_id = ?",[teacherId,roomId,subjectId],(err,sub) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(sub)
        }
    })
})

teacher.post('/teacherSubject',(req,res) => {
    const teacherId = req.body.Teacher_id;
    db.query("SELECT * FROM `SubjectTime` WHERE `Teacher_id` = ?",[teacherId],(err,sub) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(sub)
        }
    })
})

function uniq(a) {
    var seen = {};
    return a.filter(function (item) {
        return seen.hasOwnProperty(item) ? false : (seen[item] = true);
    });
}

teacher.post('/uploadFile/:subjectId/:teacherId/:roomId/', async (req, res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const subjectId = await req.params.subjectId;
    const teacherId = await req.params.teacherId;
    const roomId = await req.params.roomId;
    const today = new Date()

    const file = req.files.file;
    db.query('INSERT INTO `Subject_doc`(`Subject_id`, `Teacher_id`, `File_type`, `File_Path`, `Room_id`) VALUES (?,?,?,?,?)', [subjectId, teacherId, "pdf", `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${file.name}`,roomId],(err,result) => {
        if(err){
            console.log(err);
        }
        else{
            // res.status(200).send('Data inserted.')
            db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)',["อัพโหลดเอกสาร",teacherId,roomId,subjectId,today,""],(err2,result2) => {
                if(err2) {
                    console.log(err2)
                }
                else{
                    file.mv(`/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${file.name}`, err3 => {
                        if (err) {
                            return res.status(500).send(err3)
                        }
                        
                        res.json({ fileName: file.name, filePath: `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${file.name}` })
                    })  
                }
            })
        }
    })
})

teacher.post('/addWork',(req,res) => {
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const workName = req.body.Work_Name;
    const workDetail = req.body.Work_Detail;
    const end = req.body.End;
    const score = String(req.body.Score);
    const today = new Date()

    db.query('INSERT INTO `Subject_Work`(`Subject_id`, `Teacher_id`, `Room_id`, `Work_Name`, `Work_Detail`, `Work_Status`, `Start`, `End`, `Score`, `File_Path`) VALUES (?,?,?,?,?,?,?,?,?,?)', [subjectId, teacherId, roomId, workName, workDetail, 'open', today, end, score, ''], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            // res.status(200).send('Data inserted.')
            db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)', ["เพิ่มงานใหม่", teacherId, roomId, subjectId, today, ""], (err2, result2) => {
                if (err2) {
                    console.log(err2)
                }
                else {
                    res.send('work created')
                }
            })
        }
    })
})

teacher.post('/uploadWorkFiles/:subjectId/:teacherId/:roomId/:workName', async (req, res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const subjectId = await req.params.subjectId;
    const teacherId = await req.params.teacherId;
    const roomId = await req.params.roomId;
    const workName = await req.params.workName;

    const file = req.files.file;
    const type = file.mimetype;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploadWorks/${subjectId}/${teacherId}/${roomId}/${workName}`

    if(!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true })
    }


    db.query('INSERT INTO `file_work`(`File_path`, `File_type`) VALUES (?,?)', [`${dir}/${file.name}`, type === 'application/pdf' ? 'pdf' : 'image'], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            // res.status(200).send('Data inserted.')
            file.mv(`${dir}/${file.name}`, err3 => {
                if (err3) {
                    return res.status(500).send(err3)
                }
                else{
                    res.json({ fileName: file.name, filePath: dir })
                }
            })
        }
    })
})

teacher.post('/allFolders',(req,res) => {
    const roomId = req.body.Room_id;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    db.query('SELECT `Folder_path` FROM `Subject_doc` WHERE `Room_id` = ? AND `Teacher_id` = ? AND `Subject_id` = ?',[roomId,teacherId,subjectId],(err,path) => {
        if(err){
            console.log(err)
        }
        else{
            let docs = [];
            for(let i = 0; i < path.length; i++){
                docs.push(path[i].Folder_path)
            }
            res.send(docs)  
        }
    })
})

teacher.post('/file',(req,res) => {
    const file = req.body.filePath;
    pdf2base64(file)
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
})

teacher.delete('/deleteFile',(req,res) => {
    const path = req.body.File_Path;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;
    //delete notification when delete a file

    db.query('DELETE FROM `Subject_doc` WHERE `Subject_id` = ? AND `Teacher_id` = ? AND `File_Path` = ? AND `Room_id` = ?',[subjectId,teacherId,path,roomId], (err,result) => {
        if(err){
            console.log(err)
        }
        else{
            fs.unlinkSync(path);
            res.send('File is now deleted.');
        }
    })
})

teacher.post('/uploadDoc', (req, res) => {
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const fileType = req.body.File_type;
    const file = req.body.File;

    db.query("INSERT INTO `Subject_doc`(`Subject_id`, `Teacher_id`, `File_type`, `File`) VALUES (?,?,?,?)", [subjectId, teacherId, fileType, file], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            res.send("data inserted!")
        }
    })
})

teacher.post('/seenNotification', (req, res) => {
    const teacherId = req.body.Teacher_id;
    let unreadNoti = [];
    let readNoti = [];
    let newNoti = [];
    db.query('SELECT `unread_noti`,`new_noti`,`read_noti` FROM `Teacher` WHERE `Teacher_id` = ?', [teacherId], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result[0].unread_noti.length === 0) {
                unreadNoti = [];
            }
            else {
                result[0].unread_noti.split("[")[1].split("]")[0].split(",").map(v => {
                    unreadNoti.push(parseInt(v))
                })
            }

            if (result[0].new_noti.length === 0) {
                newNoti = [];
            }
            else {
                result[0].new_noti.split("[")[1].split("]")[0].split(",").map(v => {
                    newNoti.push(parseInt(v))
                })
                newNoti.filter(e => !unreadNoti.includes(e)).map(v => unreadNoti.push(v))
                db.query('UPDATE `Teacher` SET `new_noti` = ?, `unread_noti`= ? WHERE `Teacher_id` = ?', ["", JSON.stringify(unreadNoti), teacherId], (err2, result2) => {
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

teacher.post('/allWork',(req,res) => {
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;

    db.query('SELECT * FROM `Subject_Work` WHERE `Teacher_id` = ? AND `Subject_id` = ? AND `Room_id` = ? AND `Work_Status` = ?',[teacherId,subjectId,roomId,'open'],(err,work) => {
        if(err){
            console.log.log(err)
        }
        else{
            res.send(work)
        }
    })
})

teacher.delete('/deleteWork',(req,res) => {
    const work = req.body.selectedWork
    const fileId = [];

    if(work.File_Path){
        const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploadWorks/${work.Subject_id}/${work.Teacher_id}/${work.Room_id}/${work.Work_Name}`

        work.File_Path.split('[')[1].split(']')[0].split(',').map(v => {
            fileId.push(parseInt(v))
        })

        db.query('DELETE FROM `Subject_Work` WHERE `Subject_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Work_Name` = ? AND `Work_Detail` = ? AND `Work_Status` = ? AND `Start` = ? AND `End` = ? AND `Score` = ? AND `File_Path` = ?',
            [work.Subject_id, work.Teacher_id, work.Room_id, work.Work_Name, work.Work_Detail, work.Work_Status, work.Start, work.End, work.Score, work.File_Path], (err, result) => {
            if (err) {
                console.log(err)
            }
            else {
                fileId.map(v => {
                    db.query('DELETE FROM `file_work` WHERE `Work_File_id` = ?', [v], (err2, result2) => {
                        if (err2) {
                            console.log(err2)
                        }
                    })
                })
                fs.rmdirSync(dir, { recursive: true });

                res.send('deleted')
            }
        })
    }
    else{
        db.query('DELETE FROM `Subject_Work` WHERE `Subject_id` = ? AND `Teacher_id` = ? AND `Room_id` = ? AND `Work_Name` = ? AND `Work_Detail` = ? AND `Work_Status` = ? AND `Start` = ? AND `End` = ? AND `Score` = ? AND `File_Path` = ?',
            [work.Subject_id, work.Teacher_id, work.Room_id, work.Work_Name, work.Work_Detail, work.Work_Status, work.Start, work.End, work.Score,''], (err, result) => {
                if (err) {
                    console.log(err)
                }
                else {
                    res.send('deleted')
                }
            })
    }
})

teacher.delete('/deleteOnePrepare',(req,res) => {
    const fileName = req.body.path;
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const workName = req.body.Work_Name;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploadWorks/${subjectId}/${teacherId}/${roomId}/${workName}`

    db.query('DELETE FROM `file_work` WHERE `File_path` = ?',[`${dir}/${fileName}`], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            fs.unlinkSync(`${dir}/${fileName}`);
            res.send('deleted')
        }
    })
})

teacher.delete('/deletePrepare',async(req,res) => {
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const workName = req.body.Work_Name;

    var fileName = [];

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploadWorks/${subjectId}/${teacherId}/${roomId}/${workName}`

    db.query('SELECT `File_path` FROM `file_work` WHERE `File_path` LIKE ?', [`${dir}%`], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            result.map(v => {
                fileName.push(v.File_path.split('\\').pop().split('/').pop())
            })

            // console.log(fileName)
            fileName.map(v => {
                db.query('DELETE FROM `file_work` WHERE `File_path` = ?', [`${dir}/${v}`], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                })
            })

            fs.rmdirSync(dir, { recursive: true });

            res.send('canceled')
        }
    })
})

teacher.post('/addWorkWithFiles',(req,res) => {
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const roomId = req.body.Room_id;
    const workName = req.body.Work_Name;
    const workDetail = req.body.Work_Detail;
    const end = req.body.End;
    const score = String(req.body.Score);
    const today = new Date()

    var fileId = [];

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploadWorks/${subjectId}/${teacherId}/${roomId}/${workName}`

    db.query('SELECT `Work_File_id` FROM `file_work` WHERE `File_path` LIKE ?',[`${dir}%`],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            result.map(v => {
                fileId.push(v.Work_File_id)
            })

            db.query('INSERT INTO `Subject_Work`(`Subject_id`, `Teacher_id`, `Room_id`, `Work_Name`, `Work_Detail`, `Work_Status`, `Start`, `End`, `Score`, `File_Path`) VALUES (?,?,?,?,?,?,?,?,?,?)',
            [subjectId,teacherId,roomId,workName,workDetail,'open',today,end,score,JSON.stringify(fileId)], (err, result) => {
                if (err) {
                    console.log(err);
                }
                else {
                    // res.status(200).send('Data inserted.')
                    db.query('INSERT INTO `Notification`( `Noti_Detail`, `Teacher_id`, `Room_id`, `Subject_id`, `Noti_Time`, `Student_id`) VALUES (?,?,?,?,?,?)', ["เพิ่มงานใหม่", teacherId, roomId, subjectId, today, ""], (err2, result2) => {
                        if (err2) {
                            console.log(err2)
                        }
                        else {
                            res.send('work created')
                        }
                    })
                }
            })
        }
    })
})

module.exports = teacher