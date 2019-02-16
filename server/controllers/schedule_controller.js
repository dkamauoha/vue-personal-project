module.exports = {
    createAppointment: (req, res, next) => {
        const dbInstance = req.app.get('db');
        // console.log(req.body)
        // console.log(req.session.user);
        const { start_date, start_time, end_date, end_time, service } = req.body;
        
        const { auth_id } = req.session.user;
        dbInstance.create_appointment([start_date, start_time, end_date, end_time, service, auth_id])
            .then(res.sendStatus(200))
            .catch(err => {
                console.log(err);
                res.status(500).send('Unable to make appointment')
            })
    }
}