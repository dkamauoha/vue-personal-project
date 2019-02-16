module.exports = {
    getImages: (req, res, next) => {
        const dbInstance = req.app.get('db');
        dbInstance.get_images()
            .then(images => res.status(200).send(images))
            .catch(err => {
                console.log(err);
                res.status(500).send('Images not found');
            });
    },

    addImage: (req, res, next) => {
        const dbInstance = req.app.get('db');
        dbInstance.add_image([req.body.image_url])
            .then(res.sendStatus(200))
            .catch(err => {
                console.log(err)
                res.status(500).send('Unable to add image');
            })
    }
}