const mongoose = require("mongoose");

const Schema = mongoose.Schema;
let TodoSchema = new Schema ({
    text: {
        type: String,
        required: true,
        minlength: 1,
        trim: true
    },
    completed: {
        type: Boolean,
        default: false
    },
    completedAt: {
        type: Number,
        default: null
    },
    _creator: {
      required: true,
      type: mongoose.Schema.Types.ObjectId
    }
});

module.exports = {
    Todo: mongoose.model("Todo", TodoSchema)
};