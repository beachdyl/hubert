class messageContainer {
    constructor(user, time, messageID, replyID, message) {
        this.user = user;
        this.time = time;
        this.messageId = messageId;
        this.replyId = replyId;
        this.message = message;
    }
    getUser() {
        return user;
    }
    getTime() {
        return time;
    }
    getMessageId() {
        return messageId;
    }
    getReplyId() {
        return replyId;
    }
    getMessage() {
        return message;
    }
}

export default {messageContainer};
