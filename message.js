class messageContainer {
    constructor(user, time, messageId, replyId, message) {
        this.user = user;
        this.time = time;
        this.messageId = messageId;
        this.replyId = replyId;
        this.message = message;
    }
    getUser() {
        return this.user;
    }
    getTime() {
        return this.time;
    }
    getMessageId() {
        return this.messageId;
    }
    getReplyId() {
        return this.replyId;
    }
    getMessage() {
        return this.message;
    }
}

export default {messageContainer};
