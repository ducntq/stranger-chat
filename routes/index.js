/* GET home page. */
exports.index = function(req, res) {
    var view = req.host + '/index';
    console.log('got to here');
    res.render(view, { title: 'Chat với người lạ' }, function(err, html) {
        if (err) {
            console.log('got to he123321re');
            res.render('index');
        }

        res.send(html);
    });
};
