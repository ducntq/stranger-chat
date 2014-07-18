(function(socket, $) {
    var $txtInput = $('#txt-input'),
        $status = $('#status'),
        $btnNew = $('#btn-new'),
        $btnSubmit = $('#btn-submit'),
        $content = $('#content'),
        $online = $('#online'),
        typingTimeout;

    function disableInput(toggle){
        $txtInput.attr('disabled', toggle);
        $btnSubmit.attr('disabled', toggle);
    }

    function insertMessage(data, self) {
        var chatClass = self ? 'bg-success' : 'bg-info';
        var $chatItem = $('<p />').addClass('chat-item').addClass(chatClass);
        $('<span />').addClass('sender').text(self ? "Bạn:" : "Người lạ:").appendTo($chatItem);
        $('<span />').addClass('message').text(data.message).appendTo($chatItem);
        $chatItem.appendTo($content);
        $content.scrollTop(1e10);
    }

    function partnerLeft() {
        $('<p />').addClass('chat-item').addClass('bg-danger').text('Người lạ đã rời phòng chat').appendTo($content);
        $content.scrollTop(1e10);
        $status.text('Người lạ đã kết thúc chat');
        disableInput(true);
    }

    function sendMessage() {
        var data = {message: $txtInput.val()};
        insertMessage(data, true);
        socket.emit('send_msg', data);
        $txtInput.val('');
    }

    function clearChat() {
        $content.html('');
    }

    disableInput(true);

    $btnNew.on('click', function() {
        socket.emit('ready_to_find');
        $status.html('Đang tìm người để chat cùng. Xin vui lòng chờ. <i class="fa fa-spinner fa-spin"></i>');
    });

    $btnSubmit.on('click', function() {
        sendMessage();
    });

    socket.on('ready', function() {
        $status.text('Đã tìm được người lạ để chat!');
        clearChat();
        disableInput(false);
        $txtInput.focus();
    });

    socket.on('got_msg', function(data) {
        insertMessage(data, false);
    });

    socket.on('partner_left', function() {
        partnerLeft();
    });

    socket.on('partner_typing', function() {
        $status.text('Người lạ đang gõ...');
    });

    socket.on('partner_not_typing', function() {
        $status.text('');
    });

    if ($online.length > 0) {
        socket.on('online_users', function (data) {
            $online.text('Online: ' + data.number);
        });
    }

    //socket.emit('request_online_users');

    $txtInput.on('keydown', function(e) {
        if (e.keyCode !== 13) {
            socket.emit('typing');
            clearTimeout(typingTimeout);
            typingTimeout = setTimeout(function () {
                socket.emit('not_typing');
            }, 1000);
            return true;
        } else {
            sendMessage();
            return false;
        }
    });
})(io.connect(), jQuery);