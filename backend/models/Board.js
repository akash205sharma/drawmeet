const mongoose = require('mongoose');

const BoardSchema = new mongoose.Schema(
{
    title:{
        type:String,
        required:true
    },

    owner:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    members:[
        {
            type:mongoose.Schema.Types.ObjectId,
            ref:"User"
        }
    ],
    notes:[
        {
            text:String,
            color:String,
            x:Number,
            y:Number,
            user:{
                type:mongoose.Schema.Types.ObjectId,
                ref:"User"
            },
            createdAt:{
                type:Date,
                default:Date.now
            }
        }
    ]
},
{
    timestamps:true
});

module.exports = mongoose.model("Board", BoardSchema);