const express = require('express')
const Sequelize = require('sequelize')
const creatorRouter = express.Router()
const moment = require('moment')
require('dotenv').config()
const {
    DB_URL,
    DB_USER,
    DB_PASS,
    DB_NAME,
    DB_PORT
} = process.env

const sequelize = new Sequelize(
    DB_NAME,
    DB_USER,
    DB_PASS,
    {
        host: DB_URL,
        port: DB_PORT,
        logging: console.log,
        maxConcurrentQueries: 100,
        dialect: 'mysql',
        dialectOptions: {
            ssl: 'Amazon RDS'
        },
        pool: { maxConnections: 5, maxIdleTime: 30 },
        language: 'en',
    }
)

creatorRouter.get('/', async function (req, res) {
    const { isEvents, isShows } = req.query
    if (isEvents && isShows) {
        const creators = await sequelize
            .query(
                `SELECT *
                    FROM Users AS u,
                         Events AS e,
                         Shows AS s
                    WHERE s.showEventID = e.id
                    AND e.creatorID = 'u.id'`
            )
        res.send(creators[0])
    }
    else if (isEvents) {
        const creators = await sequelize
            .query(
                `SELECT *
                     FROM Users AS u,
                          Events AS e
                     WHERE e.creatorID = 'u.id'`
            )
        res.send(creators[0])
    }
    else {
        const creators = await sequelize
            .query(
                `SELECT *
                    FROM Users
                    WHERE userRole = 'Creator'
                    AND id NOT IN(SELECT creatorID
                                FROM Events)`
            )
        res.send(creators[0])
    }
})

creatorRouter.get('/:id', async function (req, res) {
    const { id } = req.params
    const creator = {}
    const Data = await sequelize
        .query(
            `SELECT * FROM Users
            WHERE Users.id = '${id}'`
        )
    creator['Data'] = Data[0][0]

    const Events = await sequelize
        .query(
            `SELECT * FROM Events
            WHERE creatorID = '${id}'`
        )
    if (Events[0].length) {
        const Shows = await sequelize
            .query(
                `SELECT * FROM Shows
            WHERE showEventID = ${Events[0][0].id}
            GROUP BY showEventID`
            )

        creator['Events'] = Events[0][0]
        for (let event of creator.Events) {
            for (let show of Shows[0]) {
                if (show.showEventID === event.id) {
                    moment() < moment(show.startTime).tz("Europe/Paris") ?
                        event['futureShows'].push(show) :
                        event['pastShows'].push(show)
                }
            }
        }
    }
    res.send(creator)
})

creatorRouter.get('/general/details', async function (req, res) {
    const general = {}
    const categories = await sequelize
        .query(
            `SELECT * FROM Categories`
        )
    const ratings = await sequelize
        .query(
            `SELECT * FROM Show_Ratings`
        )
    general['categories'] = [...categories[0]]
    general['ratings'] = [...ratings[0]]
    res.send(general)
})

creatorRouter.post('/', async function (req, res) {
    const {
        id,
        firstName,
        lastName,
        username,
        imageURL,
        videoURL,
        email,
        birthday,
        memberSince,
        gender,
        about,
        userRole,
        isAuthorized,
        phone
    } = req.body
    try {
        await sequelize
            .query(
                `INSERT INTO Users VALUES(
                                        '${escape(id)}',
                                        '${firstName}',
                                        '${lastName}',
                                        '${username}',
                                        '${imageURL}',
                                        '${videoURL}',
                                        '${email}',
                                        '${birthday}',                                                     
                                        '${memberSince}',
                                        '${gender}',
                                        '${about}',
                                        '${userRole}',
                                         ${isAuthorized},
                                        '${phone}'
                                    )`
            )
        const saved = await sequelize
            .query(
                `SELECT * FROM Users
                    WHERE Users.id = '${id}'`
            )
        res.send(saved[0][0])
    }
    catch (err) {
        res.send('saving error')
    }
})

creatorRouter.put('/:id', async function (req, res) {
    const { id } = req.params
    const { field } = req.body
    let { value } = req.body
    if (typeof value === 'string') value = `'${value}'`

    try {
        await sequelize
            .query(
                `UPDATE Users
            SET ${field} = ${value}
            WHERE id = '${id}'`
            )
        res.send(true)
    }
    catch (err) {
        res.send(false)
    }
})

creatorRouter.delete('/:id', async function (req, res) {
    const { id } = req.params
    try {
        await sequelize
            .query(
                `DELETE FROM Users
            WHERE id = '${id}'`
            )
        res.send(id)
    }
    catch (err) {
        res.send('delete err')
    }
})

module.exports = creatorRouter


