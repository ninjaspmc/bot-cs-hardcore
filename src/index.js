const express = require("express");
const http = require("http");
const mineflayer = require('mineflayer')
const pvp = require('mineflayer-pvp').plugin
const { pathfinder, Movements, goals} = require('mineflayer-pathfinder')
const armorManager = require('mineflayer-armor-manager')
const mc = require('minecraft-protocol');
const AutoAuth = require('mineflayer-auto-auth');
const app = express();

app.use(express.json());

app.get("/", (_, res) => res.sendFile(__dirname + "/index.html"));

setInterval(() => {
  http.get(`https://vercel.app`); // Insira aqui a URL gerada pelo Vercel, ele sempre termina em "vercel.app"
}, 224000);

function createBot () {
const bot = mineflayer.createBot({
  host: 'devscommunity.aternos.me', // Insira aqui o endereço IP do servidor 
  version: false,
  username: 'Devs', // Insira aqui o nome do bot do servidor 
  port: 12070, // Insira aqui a porta do servidor 
  plugins: [AutoAuth],
  AutoAuth: 'bot112022'
})
bot.loadPlugin(pvp)
bot.loadPlugin(armorManager)
bot.loadPlugin(pathfinder)

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const sword = bot.inventory.items().find(item => item.name.includes('sword'))
    if (sword) bot.equip(sword, 'hand')
  }, 150)
})

bot.on('playerCollect', (collector, itemDrop) => {
  if (collector !== bot.entity) return

  setTimeout(() => {
    const shield = bot.inventory.items().find(item => item.name.includes('shield'))
    if (shield) bot.equip(shield, 'off-hand')
  }, 250)
})

let guardPos = null

function guardArea (pos) {
  guardPos = pos.clone()

  if (!bot.pvp.target) {
    moveToGuardPos()
  }
}

function stopGuarding () {
  guardPos = null
  bot.pvp.stop()
  bot.pathfinder.setGoal(null)
}

function moveToGuardPos () {
  const mcData = require('minecraft-data')(bot.version)
  bot.pathfinder.setMovements(new Movements(bot, mcData))
  bot.pathfinder.setGoal(new goals.GoalBlock(guardPos.x, guardPos.y, guardPos.z))
}

bot.on('stoppedAttacking', () => {
  if (guardPos) {
    moveToGuardPos()
  }
})

bot.on('physicTick', () => {
  if (bot.pvp.target) return
  if (bot.pathfinder.isMoving()) return

  const entity = bot.nearestEntity()
  if (entity) bot.lookAt(entity.position.offset(0, entity.height, 0))
})
bot.on('physicTick', () => {
  if (!guardPos) return
  const filter = e => e.type === 'mob' && e.position.distanceTo(bot.entity.position) < 16 &&
                      e.mobType !== 'Armor Stand' 
  const entity = bot.nearestEntity(filter)
  if (entity) {
    bot.pvp.attack(entity)
  }
})
bot.on('chat', (username, message) => {
  if (message === 'guard') {
    const player = bot.players[username]

    if (!player) {
    bot.chat('I will!')
    guardArea(player.entity.position)
    }

  }
  if (message === 'stop') {
    bot.chat('I will stop!')
    stopGuarding()
  }
})

bot.on('kicked', console.log)
bot.on('error', console.log)
bot.on('end', createBot)
}

createBot()

const PORT = process.env.PORT || 3001
app.listen(process.env.PORT);