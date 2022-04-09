import 'dotenv/config';
import {config, createSchema} from '@keystone-next/keystone/schema';
import { User } from './schemas/User';
import { createAuth } from '@keystone-next/auth';
import {withItemData, statelessSessions} from '@keystone-next/keystone/session'
import { Product } from './schemas/Product';
import { ProductImage } from './schemas/ProductImage';
import { insertSeedData } from './seed-data';
const databaseURL = process.env.DATABASE_URL || 'mongodb://localhost/keystone-cool-trees-tutorial'; 
//when somebody logs in keystone will set a cookie and that gives them a 
//session. They are logged in till they log out or the cookie expires
const sessionConfig = {
    //so we are logging in to the KeyStone backend in 
    //order to authenticate the user in frontend of our react application
    //we are gonna use something called session. This will set a cookie in our 
    //browser that has this thing called jwt. Essentaillay, how long does the user stay signed in

    maxAge: 60* 60*24*360, //How long should they stay signed in
    secret: process.env.COOKIE_SECRET,
}; 
//we will create a method called withAuth that has some settings in it and that's gonna
//layer in the secret source that has the ability to have Auth in Keystone

const {withAuth} = createAuth({
    //it needs to know which schema is going to be responsible for being the user
    listKey: 'User',
    identityField: 'email',
    secretField: 'password',
    initFirstItem: {
        fields: ['name','email','password'],
        //TODO: ADD IN INITIAL ROLES HERE
    }
})

export default withAuth(config({
    server: {
        cors: {
            origin: [process.env.FRONTEND_URL],
            credentials: true,
        },
    },
    db: {
        adapter: 'mongoose',
        url: databaseURL,
        //Todo: Add data seeding here
        //The database has an on connect function that we can hook into
        async onConnect(keystone){
            //once you connect to the database, just inject all of these items straight
            //away straight into the database
            console.log('Connect to the database ');
            //we dont want to do it everytime, we want to do it when they run keystone
            if(process.argv.includes('--seed-data')) {
                await insertSeedData(keystone);
            }
            
        }
    },
    //Keystone refers to our data types as lists
    lists: createSchema({
        //Schema items go in here
        User,
        Product,
        ProductImage,
    }),
    ui: {
        //show the ui only for people who pass this test
        //do you want people to access keystone ui?
        //Todo: change this for roles
        isAccessAllowed: ({session}) => {
                // console.log(session);
                return !!session?.data;
                //we do !! to force the data to be a string
        },
    },
    //Todo add session values here
    session: withItemData(statelessSessions(sessionConfig),{
        User: `id`
    })
}))