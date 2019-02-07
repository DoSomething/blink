'use strict';

class Message {
  constructor(message) {
    this.message = message;
  }
  getBody(parsed) {
    const body = this.message.Body;
    return parsed ? JSON.parse(body) : body;
  }
  getRequestId() {
    const msgAttributes = this.message.MessageAttributes;
    return msgAttributes ? msgAttributes['Request-Id'] : undefined;
  }
  /**
   * Defining ApproximateReceiveCount as the retry count has it's tradeoffs.
   * Some tradeoffs:
   *    1. It's an approximation. Due to the distributed system of AWS SQS. A message can remain
   *    hidden somewhere in SQS even after the delete command is sent from the consumer.
   *    Once it becomes visible again, the value of ApproximateReceiveCount will increase.
   *
   *    2. If the message is "viewed" N times through the AWS console.
   *    This number will increment by N times.
   */
  getRetryAttempt() {
    const attributes = this.message.Attributes;
    // -1 because receive count will be at least 1 for all successfully processed messages.
    return attributes ? attributes.ApproximateReceiveCount - 1 : undefined;
  }
}

exports.Message = Message;
