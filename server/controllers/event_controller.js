module.exports = {
    getAllAppointments: (req, res, next) => {
        const dbInstance = req.app.get('db');
        dbInstance.get_all_events([req.session.user.auth_id])
            .then((events) => res.status(200).send(events))
            .catch(err => {
                console.log(err);
                res.status(500).send('Unable to find appointments');
            })
    },

    getEvents: (req, res, next) => {
        const dbInstance = req.app.get('db');
        dbInstance.get_events([req.session.user.auth_id])
            .then((events) => res.status(200).send(events))
            .catch(err => {
                console.log(err);
                res.status(500).send('Unable to find appointments');
            })
    },

    updateEvent: (req, res, next) => {
        const dbInstance = req.app.get('db');
        const { appointment_id, start_date, start_time, end_time, service } = req.body;
        dbInstance.update_event([req.session.user.auth_id, appointment_id, start_date, start_time, end_time, service])
            .then(() => res.sendStatus(200))
            .catch(err => {
                console.log(err);
                res.status(500).send('Unable to update the appointment');
            });
    },

    deleteEvent: (req, res, next) => {
        const dbInstance = req.app.get('db');
        dbInstance.delete_event([req.params.id])
            .then(() => res.sendStatus(200))
            .catch(err => {
                console.log(err);
                res.status(500).send('Unable to delete the appointment');
            })
    }
}