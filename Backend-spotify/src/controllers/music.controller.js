const musicModel=require('../models/music.model')
const albumModel=require('../models/album.model')
const uploadFile=require('../services/storage.service')
const jwt=require('jsonwebtoken')

async function createMusic(req,res){
    const {title}=req.body
    if(!title){
      return res.status(400).json({
        message:"music title is required"
      });
    }
    const file=req.file
    if(!file){
      return res.status(400).json({
        message:"Music file is required"
      });
    }
    const result =await uploadFile(file.buffer.toString('base64'))
    const music=await musicModel.create({
        uri:result.url,
        title,
        artist:req.user.id
    })

    res.status(201).json({
        message:'Music created successfully',
        music:{
            id:music._id,
            title:music.title,
            uri:music.uri,
            artist:music.artist
        }
    })
    
}

async function createAlbum(req,res){
  try{
    const {title,musics}=req.body;

    if(!title){
      return res.status(400).json({
        message:"Album title is required"
      });
    }

    const album=await albumModel.create({
        title,
        musics:musics||[],
        artist:req.user.id
    });

    res.status(201).json({
        message:'Album created successfully',
        album:{
            id:album._id,
            title:album.title,
            musics:album.musics,
            artist:album.artist
        }
    });

  }catch(err){
    res.status(500).json({message:"Server error"});
  }
}
 

async function getAllMusics(req,res){
    const musics=await musicModel
    .find()
    .skip(0)
    .limit(req.query.limit || 6)
    .populate('artist','username email')

    res.status(200).json({
        message:'Musics fetched successfully',
        musics:musics
    })
}

async function getAllAlbums(req,res){
    const albums=await albumModel
        .find({ artist: req.user.id })
        .select("title artist")
        .populate('artist','username email')
    res.status(200).json({
        message:'Albums fetched successfully',
        albums:albums
    })
}

async function getAlbumById(req,res){
    const albumId=req.params.albumId
    const album=await albumModel
        .findById(albumId)
        .populate('musics')
        .populate('artist','username email')
    if(!album){
        return res.status(404).json({
            message:'Album not found'
        })
    }
    res.status(200).json({
        message:'Album fetched successfully',
        album:album
    })
}


module.exports={createMusic,createAlbum,getAllMusics,getAllAlbums,getAlbumById}
