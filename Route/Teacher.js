const express = require('express');
const teacher = express.Router()
const mysql = require('mysql');
const fileUpload = require('express-fileupload');
const pdf2base64 = require('pdf-to-base64');
const imageToBase64 = require('image-to-base64');
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

teacher.post('/uploadFile/:subjectId/:teacherId/:roomId/:folder', (req, res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const subjectId = req.params.subjectId;
    const teacherId = req.params.teacherId;
    const roomId = req.params.roomId;
    const folderName = req.params.folder;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}`

    const file = req.files.file;
    
    if(!fs.existsSync(`${dir}/${folderName}`)){
        fs.mkdirSync(`${dir}/${folderName}`, { recursive: true })
    }

    db.query('INSERT INTO `file_doc`(`File_Path`, `File_type`) VALUES (?,?)', [`${dir}/${folderName}/${file.name}`, "pdf"], (err, result) => {
        if (err) {
            console.log(err);
        }
        else {
            file.mv(`${dir}/${folderName}/${file.name}`, err3 => {
                if (err) {
                    return res.status(500).send(err3)
                }

                res.json({ fileName: file.name, filePath: `${dir}/${folderName}/${file.name}` })
            })
            // res.status(200).send('Data inserted.')
        }
    })
})

teacher.post('/uploadFileInFolder',(req,res) => {
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const folder = req.body.folder;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}/${folder}`

    var files = [];

    db.query('SELECT File_Doc_id FROM file_doc WHERE File_Path LIKE ?',[`${dir}%`],(err,id) => {
        if(err){
            console.log(err)
        }
        else{
            id.map(v => files.push(v.File_Doc_id))
            db.query('UPDATE `Subject_doc` SET `files` = ? WHERE `Folder_path` = ?',[JSON.stringify(files),dir], err2 => {
                if(err2){
                    console.log(err2)
                }
                else{
                    res.send('uploaded')
                }
            })
        }
    })
})

teacher.post('/uploadClip/:subjectId/:teacherId/:roomId/:folder/:ClipName', (req, res) => {
    if (req.files === null) {
        return res.status(400).json({ msg: 'No file uploaded' });
    }

    const subjectId = req.params.subjectId;
    const teacherId = req.params.teacherId;
    const roomId = req.params.roomId;
    const folderName = req.params.folder;
    const clipName = req.params.ClipName;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/TeacherUploadClip/${subjectId}/${teacherId}/${roomId}`

    const file = req.files.clip;

    if (!fs.existsSync(`${dir}/${folderName}`)) {
        fs.mkdirSync(`${dir}/${folderName}`, { recursive: true })
    }

    db.query('INSERT INTO `file_clip`(`File_Path`,`Clip_Name`) VALUES (?,?)', [`${dir}/${folderName}/${file.name}`,clipName], (err) => {
        if (err) {
            console.log(err);
        }
        else {
            file.mv(`${dir}/${folderName}/${file.name}`, err3 => {
                if (err) {
                    return res.status(500).send(err3)
                }

                res.json({ fileName: file.name, filePath: `${dir}/${folderName}/${file.name}` })
            })
            // res.status(200).send('Data inserted.')
        }
    })
})

teacher.post('/uploadClipInFolder', (req, res) => {
    const roomId = req.body.Room_id;
    const subjectId = req.body.Subject_id;
    const teacherId = req.body.Teacher_id;
    const folder = req.body.folder;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/TeacherUploadClip/${subjectId}/${teacherId}/${roomId}/${folder}`

    var files = [];

    db.query('SELECT `File_Clip_id` FROM `file_clip` WHERE `File_Path` LIKE ?', [`${dir}%`], (err, id) => {
        if (err) {
            console.log(err)
        }
        else {
            id.map(v => files.push(v.File_Clip_id))
            db.query('UPDATE `Subject_clip` SET `files` = ? WHERE `Folder_path` = ?', [JSON.stringify(files), dir], err2 => {
                if (err2) {
                    console.log(err2)
                }
                else {
                    res.send('uploaded')
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

teacher.post('/allClipFolders', (req, res) => {
    const roomId = req.body.Room_id;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    db.query('SELECT `Folder_path` FROM `Subject_clip` WHERE `Room_id` = ? AND `Teacher_id` = ? AND `Subject_id` = ?', [roomId, teacherId, subjectId], (err, path) => {
        if (err) {
            console.log(err)
        }
        else {
            let docs = [];
            for (let i = 0; i < path.length; i++) {
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

teacher.get('/video/:path/:name/:subjectId/:teacherId/:roomId',(req,res) => {
    const range = req.headers.range;
    const path = req.params.path;
    const name = req.params.name;
    const subjectId = req.params.subjectId;
    const teacherId = req.params.teacherId;
    const roomId = req.params.roomId;

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/TeacherUploadClip/${subjectId}/${teacherId}/${roomId}/${path}/${name}`;
    if (!range) {
        res.status(400).send("Requires Range header");
    }
    const videoSize = fs.statSync(dir).size;
    const CHUNK_SIZE = 10 ** 6; // 1MB
    const start = Number(range.replace(/\D/g, ""));
    const end = Math.min(start + CHUNK_SIZE, videoSize - 1);
    // Create headers
    const contentLength = end - start + 1;
    const headers = {
        "Content-Range": `bytes ${start}-${end}/${videoSize}`,
        "Accept-Ranges": "bytes",
        "Content-Length": contentLength,
        "Content-Type": "video/mp4",
    };

    // HTTP Status 206 for Partial Content
    res.writeHead(206, headers);

    // create video read stream for this particular chunk
    const videoStream = fs.createReadStream(dir, { start, end });

    // Stream the video chunk to the client
    videoStream.pipe(res);
})

teacher.post('/image',(req,res) => {
    const img = req.body.filePath;
    imageToBase64(img) // Path to the image
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
})

teacher.delete('/deleteFile',(req,res) => {
    const file = req.body.File;
    const teacherId = req.body.Teacher_id;
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;
    var folderName = [];
    var filesInFolder = [];

    file.File_Path.split('/').map(v => {folderName.push(v)})

    const dir = `/Users/yen/Desktop/FinalProject/component/final/src/components/uploads/${subjectId}/${teacherId}/${roomId}/${folderName[folderName.length - 2]}`;
    //delete notification when delete a file

    db.query('SELECT * FROM `Subject_doc` WHERE `Folder_path` = ? AND `files` LIKE ?',[dir,`%${file.File_Doc_id}%`],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            result[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                if(parseInt(v) !== file.File_Doc_id){
                    filesInFolder.push(parseInt(v))
                }
            })
            db.query('DELETE FROM `file_doc` WHERE `File_Doc_id` = ? AND `File_Path` = ?', [file.File_Doc_id, file.File_Path], (err2, result2) => {
                if (err) {
                    console.log(err2)
                }
                else {
                    fs.unlinkSync(file.File_Path);
                    db.query('UPDATE `Subject_doc` SET files = ? WHERE `Folder_path` = ?', [filesInFolder.length === 0 ? '' : JSON.stringify(filesInFolder) ,dir],(err3,result3) => {
                        if(err2){
                            console.log.log(err3)
                        }
                        else{
                            res.send('file is deleted')
                        }
                    })
                }
            })
        }
    })
})

teacher.delete('/deleteFolder', (req, res) => {
    const path = req.body.File_Path;
    //delete notification when delete a file
    
    db.query('SELECT * FROM `Subject_doc` WHERE Folder_path = ?',[path],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            if(result[0].files.length === 0){
                db.query('DELETE FROM `Subject_doc` WHERE `Folder_path` = ?', [path], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.rmdirSync(path, { recursive: true });
                        res.send('File is now deleted.');
                    }
                })
            }
            else{
                db.query('SELECT * FROM `Subject_doc` WHERE `Folder_path` = ?',[path],(err,result) => {
                    if(err){
                        console.log(err)
                    }
                    else{
                        db.query('DELETE FROM `Subject_doc` WHERE `Folder_path` = ?',[path] ,async(err2) => {
                            if(err2){
                                console.log(err2)
                            }
                            else{
                                await Promise.all(
                                    result[0].files.split('[')[1].split(']')[0].split(',').map(async (key) => {
                                        return new Promise((resolve, reject) =>
                                            db.query('DELETE FROM `file_doc` WHERE `File_Doc_id` = ?', [parseInt(key)], (err, result) => {
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
                            }
                        })
                        res.send('deleted')
                    }
                })
            }
        }
    })
})

teacher.delete('/deleteClipFolder', (req, res) => {
    const path = req.body.path;
    //delete notification when delete a file

    db.query('SELECT * FROM `Subject_clip` WHERE `Folder_path` = ?', [path], (err, result) => {
        if (err) {
            console.log(err)
        }
        else {
            if (result[0].files.length === 0) {
                db.query('DELETE FROM `Subject_clip` WHERE `Folder_path` = ?', [path], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        fs.rmdirSync(path, { recursive: true });
                        res.send('File is now deleted.');
                    }
                })
            }
            else {
                db.query('SELECT * FROM `Subject_clip` WHERE `Folder_path` = ?', [path], (err, result) => {
                    if (err) {
                        console.log(err)
                    }
                    else {
                        db.query('DELETE FROM `Subject_clip` WHERE `Folder_path` = ?', [path], async (err2) => {
                            if (err2) {
                                console.log(err2)
                            }
                            else {
                                await Promise.all(
                                    result[0].files.split('[')[1].split(']')[0].split(',').map(async (key) => {
                                        return new Promise((resolve, reject) =>
                                            db.query('DELETE FROM `file_clip` WHERE `File_Clip_id` = ?', [parseInt(key)], (err, result) => {
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
                            }
                        })
                        res.send('deleted')
                    }
                })
            }
        }
    })
})

teacher.delete('/deleteClip',(req,res) => {
    const clipName = req.body.name;
    const clipPath = req.body.path;
    const clipId = req.body.id || null;
    var p = [];
    var dir = '';
    var files = [];

    clipPath.split('/').map(v => p.push(v))
    p.filter(e => e != p[p.length - 1]).map((v, i) => {
        if (i > 0) {
            dir = dir + '/' + v
        }
    })
    db.query('SELECT * FROM `Subject_clip` WHERE `Folder_path` = ?', [dir], (err2, f) => {
        if (err2) {
            console.log(err2)
        }
        else {
            f[0].files.split('[')[1].split(']')[0].split(',').map(v => {
                if (v !== String(clipId)) {
                    files.push(parseInt(v))
                }
            })
            db.query('DELETE FROM `file_clip` WHERE `File_Clip_id` = ? AND `Clip_Name` = ? AND `File_Path` = ?', [clipId,clipName,clipPath], (err3) => {
                if (err3) {
                    console.log(err3)
                }
                else {
                    db.query('UPDATE `Subject_clip` SET `files`= ? WHERE `Folder_path` = ?', [files.length === 0 ? '' : JSON.stringify(files), dir], (err4) => {
                        if (err4) {
                            console.log(err4)
                        }
                        else {
                            fs.unlinkSync(clipPath);
                            res.send('deleted')
                        }
                    })
                }
            })
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

teacher.post('/checkWork',(req,res) => {
    const subjectId = req.body.Subject_id;
    const roomId = req.body.Room_id;
    const teacherId = req.body.Teacher_id;
    const workName = req.body.Work_Name;

    var submittedStudent = [];
    db.query('SELECT * FROM `Student_Work_Submit` WHERE `Teacher_id` = ? AND `Room_id` = ? AND `Subject_id` = ? AND `Work_Name` = ?',
    [teacherId,roomId,subjectId,workName],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            if(result.length !== 0){
                result.map(v => {
                    submittedStudent.push(v)
                })
                res.send(submittedStudent)
            }
            else{
                res.send(submittedStudent)
            }
        }
    })
})

teacher.post('/allSubject',(req,res) => {
    const teacherId = req.body.Teacher_id;
    var subjects = [];
    var room = [];

    db.query('SELECT * FROM `Subject` WHERE `Teacher_id` = ?',[teacherId], async(err, result) => {
        if(err){
            console.log(err)
        }
        else{
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

teacher.post('/allStudents',(req,res) => {
    const roomId = req.body.Room_id;

    db.query('SELECT * FROM `Student` WHERE `Room_id` = ?',[roomId],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

teacher.post('/askRoom',(req,res) => {
    const roomId = req.body.roomId;

    db.query('SELECT * FROM `Room` WHERE `Room_id` = ?',[roomId],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

teacher.post('/studentParent',(req,res) => {
    const studentId = req.body.Student_id;

    db.query('SELECT * FROM `Parent` WHERE `Children` LIKE ?',[`%${studentId}%`],(err,result) => {
        if(err){
            console.log(err)
        }
        else{
            res.send(result)
        }
    })
})

module.exports = teacher