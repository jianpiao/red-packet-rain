import './style.css'

// 游戏主体
let game;

// 游戏基本配置,用于创建游戏画布
const gameOptions = {
  gameWidth: document.documentElement.clientWidth,
  gameHeight: document.documentElement.clientHeight,
  renderer: Phaser.AUTO,
  parent: document.getElementById('gameScreen'),
  selfPool: 10,
  selfPic: 'redpacket',
  rate: 0.15,
  maxSpeed: 200,
  minSpeed: 50,
  max: 95,
  time: 10, // 游戏时长
  awardText: "恭喜获得女票一位"
}

// 让它在页面加载后执行
window.onload = function () {
  const { gameWidth, gameHeight, renderer, parent } = gameOptions

  // 使用Phaser引擎创建一个游戏
  game = new Phaser.Game(gameWidth, gameHeight, renderer, parent);

  // 添加游戏
  game.state.add("TheGame", TheGame);

  // 启动游戏
  game.state.start("TheGame");
}

class TheGame {
  constructor() {
    this.launchGroup = null
    this.redPacketGroup = null
    this.canClickCoin = true
  }

  // 资源预加载，会在phaser预加载期间执行，可以实时监控资源加载的进度
  preload() {
    if (typeof (GAME) !== "undefined") {
      this.load.baseURL = GAME + "/";
    }

    // 将游戏覆盖整个屏幕，同时保持其比例
    game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;

    // 游戏水平居中
    game.scale.pageAlignHorizontally = true;

    // 游戏垂直居中
    game.scale.pageAlignVertically = true;

    // 设置舞台背景色
    game.stage.backgroundColor = '#000';

    //加载图片
    game.load.image('launchBg', 'assets/img/bg-plan.jpg')
    game.load.image('bgRainer', 'assets/img/bg-rainer.jpg')
    game.load.spritesheet('redpacket', 'assets/img/redpacket.png', 144, 173, 2) // 红包，两帧
    game.load.image('close', 'assets/img/close.png')
    game.load.image('dialogExit', 'assets/img/dialog-exit.png')
    game.load.image('buttonExit', 'assets/img/button-exit.png')
    game.load.image('buttonCancel', 'assets/img/button-cancel.png')
    game.load.image('openRedpacket', 'assets/img/open-redpacket.png')
    game.load.image('open', 'assets/img/open.png')
    game.load.image('redpacketResult', 'assets/img/redpacket-result.png')
    game.load.image('buttonContinue', 'assets/img/button-continue.png')
    game.load.image('buttonUseTicket', 'assets/img/button-use-ticket.png')
    game.load.spritesheet('cursorAnimation', 'assets/img/cursor-animation.png', 74, 108, 2) // 手势动画，两帧
    game.load.image('gameStartBtn', 'assets/img/anniu.png')
  }

  // 创建游戏画布，在游戏完全加载后立即执行
  create() {
    // 物理系统
    game.physics.startSystem(Phaser.Physics.ARCADE);
    game.physics.arcade.gravity.y = 2000;

    // 背景图
    let launchBg = game.add.sprite(0, 0, 'launchBg');
    launchBg.width = game.width;
    launchBg.height = game.height;

    // 开始按钮背景
    this.gameStartButton = game.add.button(game.world.centerX, gameOptions.gameHeight - 300, "gameStartBtn", function () {
      this.gameStartButton.visible = false
      this.gameStartText.visible = false
      this.cursorHandle.visible = false
      this.startGame()
    }, this);
    this.gameStartButton.anchor.set(0.5, 0)

    // 游戏开始文案
    const gameStartTextStyle = { fill: '#FFF', fontSize: '30px', fontWeight: 'bolder' }
    this.gameStartText = game.add.text(game.world.centerX, gameOptions.gameHeight - 250, '开始游戏', gameStartTextStyle)
    this.gameStartText.anchor.set(0.5, 0.5)

    // 手指
    this.cursorHandle = game.add.sprite(game.world.centerX - 36, gameOptions.gameHeight - 250, 'cursorAnimation')
    this.cursorHandle.animations.add('cursorAnimation')
    this.cursorHandle.play('cursorAnimation', 2, true);
  }

  // 开始游戏
  startGame() {
    // 启动游戏进行中音效
    this.gameAudio = document.getElementById('playing')
    this.gameAudio.play()
    this.gameAudio.onended = () => {
      this.gameAudio.currentTime = 0; // 重新播放
      this.gameAudio.play();
    }

    // 红包雨背景图
    let bgRainer = game.add.sprite(0, 0, 'bgRainer');
    bgRainer.width = game.width;
    bgRainer.height = game.height;

    this.config = gameOptions;
    this.redPacketGroup = game.add.group();
    this.redPacketGroup.enableBody = true;
    this.redPacketGroup.createMultiple(gameOptions.selfPool, gameOptions.selfPic); //创建许多红包
    this.redPacketGroup.setAll('anchor.y', 1)
    this.redPacketGroup.setAll('outOfBoundsKill', true);
    this.redPacketGroup.setAll('checkWorldBounds', true);
    game.time.events.loop(Phaser.Timer.SECOND * gameOptions.rate, this.createRedPacket, this);

    // 初始化游戏时间
    this.leftTime = gameOptions.time
    // 剩余时间文案
    this.leftTimeText = game.add.text(0, 0, this.leftTime, { fill: '#FFF', fontSize: '40px', fontWeight: 'bolder' })
    this.leftTimeText.scale.setTo(rfuc(1))
    this.leftTimeText.fixedToCamera = true;
    this.leftTimeText.cameraOffset.setTo(game.camera.width - rfuc(80), rfuc(20));

    // 重复切换帧，第一个参数是一帧间隔时长
    game.time.events.repeat(Phaser.Timer.SECOND, this.leftTime, this.refreshTime, this)

    // 添加右上角退出游戏按钮
    game.add.button(rfuc(20), rfuc(20), 'close', this.showExitDialog, this)

    // 创建退出游戏对话框
    this.createExitDialog()
  }

  // 创建红包
  createRedPacket() {
    const redPacket = this.redPacketGroup.getFirstExists(false); // 从组里抽取一个精灵元素
    if (redPacket) {
      redPacket.events.onInputDown.removeAll();
      redPacket.loadTexture(this.config.selfPic)
      redPacket.alpha = 1; // 设置透明度为1
      redPacket.angle = 0 // 红包旋转角度
      redPacket.reset(game.rnd.integerInRange(0, gameOptions.gameWidth - 144), 0)  //红包生成的位置
      redPacket.body.velocity.x = game.rnd.integerInRange(-200, 100);   //红包移动的速度
      redPacket.body.velocity.y = game.rnd.integerInRange(gameOptions.minSpeed, gameOptions.maxSpeed);
      redPacket.inputEnabled = true;
      redPacket.events.onInputDown.add(this.hitRedPacket, this) // 添加点击事件
    }
  }

  // 点击红包
  hitRedPacket(sprite) {
    // 选中的红包设置为不可点击
    sprite.inputEnabled = false;
    // 给红包添加帧动画
    let anim = sprite.animations.add(gameOptions.selfPic);
    // 执行帧动画
    sprite.play(gameOptions.selfPic, 20, false);
    // 帧动画切换完毕后，执行补间动画，让红包渐变消失
    anim.onComplete.add(this.killed, this, sprite)
  }

  createExitDialog() {
    // 创建一个关闭组
    this.closeGroup = game.add.group()
    // 遮罩
    const hexGraphics = new Phaser.Graphics().beginFill(0x000000, 0.5).drawRect(0, 0, gameOptions.width, gameOptions.height);
    const pausedMask = game.add.sprite(0, 0, hexGraphics.generateTexture())
    // 退出游戏对话框
    const exitDialog = game.add.sprite(game.world.centerX, game.world.centerY, 'dialogExit')
    exitDialog.anchor.set(0.5, 0.5)
    // 退出按钮
    this.exitButton = game.add.button(game.world.centerX - 130, game.world.centerY + 310, 'buttonExit')
    this.exitButton.anchor.set(0.5, 0.5)

    // 取消按钮
    this.cancelButton = game.add.button(game.world.centerX + 130, game.world.centerY + 310, 'buttonCancel')
    this.cancelButton.anchor.set(0.5, 0.5)

    this.closeGroup.add(pausedMask)
    this.closeGroup.add(exitDialog)
    this.closeGroup.add(this.exitButton)
    this.closeGroup.add(this.cancelButton)

    this.closeGroup.visible = false
  }

  showExitDialog() {
    game.paused = true
    this.gameAudio.pause()
    this.closeGroup.visible = true
    game.input.onDown.add(this.handleExitGame, this)
  }

  // 退出游戏
  handleExitGame() {
    let exitRect = new Phaser.Rectangle(game.world.centerX - 130, game.world.centerY + 310, 194, 66).copyFrom(this.exitButton);
    let cancelRect = new Phaser.Rectangle(game.world.centerX + 130, game.world.centerY + 310, 194, 66).copyFrom(this.cancelButton);
    if (this.calcContains(exitRect, game.input.x, game.input.y)) { // 监听取消事件
      game.input.onDown.remove(this.handleExitGame, this)
      this.closeGroup.visible = false
      game.paused = false
      this.restartGame() // 退回启动页（重新开始）
    } else if (this.calcContains(cancelRect, game.input.x, game.input.y)) { // 监听退出事件
      game.input.onDown.remove(this.handleExitGame, this)
      this.closeGroup.visible = false
      game.paused = false
      this.gameAudio.play() // 继续游戏
    }
  }

  calcContains(sprite, inputX, inputY) {
    const { width, height, x, y } = sprite
    const maxWidth = x + width - width / 2
    const minWidth = x - width / 2
    const maxHeight = y + height
    const minHeight = y - width / 2
    if (inputX >= minWidth && inputX <= maxWidth && inputY >= minHeight && inputY <= maxHeight) {
      return true
    }
    return false
  }

  // 退出按钮
  handleExitBtn() {
    this.closeGroup.visible = false
    game.paused = false
    this.restartGame() // 退回启动页（重新开始）
  }

  // 取消按钮
  handleCancelBtn() {
    this.closeGroup.visible = false
    game.paused = false
    this.gameAudio.play() // 继续游戏
  }

  // 刷新时间
  refreshTime() {
    this.leftTime--;
    this.leftTimeText.text = this.leftTime;
    // 时间为0，游戏结束
    if (this.leftTime === 0) {
      this.redPacketGroup.visible = false
      this.gameAudio.pause()
      this.showAwardDialog()
    }
  }

  // 展示奖励
  showAwardDialog() {
    this.showAwardGourp = game.add.group()
    this.showAwardResultGroup = game.add.group()
    //背景
    const hexGraphics = new Phaser.Graphics().beginFill(0x000000, 1).drawRect(0, 0, gameOptions.width, gameOptions.height);
    // 遮罩
    const pausedMask = game.add.sprite(0, 0, hexGraphics.generateTexture())
    // 对话框背景图
    const openDialog = game.add.sprite(game.world.centerX, game.world.centerY, 'openRedpacket')
    openDialog.anchor.set(0.5, 0.5)
    // 开奖硬币图
    this.showAwardCoin = game.add.button(game.world.centerX, game.world.centerY + 120, 'open', this.handleOpenCoin.bind(this))
    this.showAwardCoin.anchor.set(0.5, 0.5)
    // 支持点击
    this.showAwardCoin.inputEnabled = true;
    // 将上面添加进组里，方便统一管理
    this.showAwardGourp.add(pausedMask)
    this.showAwardGourp.add(openDialog)
    this.showAwardGourp.add(this.showAwardCoin)

    // 结果背景图
    const result = game.add.sprite(game.world.centerX, game.world.centerY, 'redpacketResult')
    result.anchor.set(0.5, 0.5)
    // 去用券按钮
    this.showAwardUserTicket = game.add.button(game.world.centerX - 130, game.world.centerY + 310, 'buttonUseTicket', this.handleAwardDialogBtn.bind(this))
    this.showAwardUserTicket.anchor.set(0.5, 0.5)
    // 继续抢按钮
    this.showAwardGoOn = game.add.button(game.world.centerX + 130, game.world.centerY + 310, 'buttonContinue', this.handleAwardDialogBtn.bind(this))
    this.showAwardGoOn.anchor.set(0.5, 0.5)
    // 将上面添加进组里，方便统一管理
    this.showAwardResultGroup.add(result)
    this.showAwardResultGroup.add(this.showAwardUserTicket)
    this.showAwardResultGroup.add(this.showAwardGoOn)
    // 先设置抽奖结果为隐藏
    this.showAwardResultGroup.visible = false
  }

  // 点击拆红包按钮
  handleOpenCoin() {
    if (!this.canClickCoin) return
    this.canClickCoin = false
    this.openCoin = game.add.tween(this.showAwardCoin).to({ angle: -20 }, 100, 'Linear', true, 0, 6, true);
    this.openCoin.onComplete.add(this.getAwardResult, this)
  }

  // 显示开奖结果
  getAwardResult() {
    document.getElementById('audioOpen').play()
    let ticketStyle = { fill: '#ffe67d', fontSize: '46px', fontWeight: 'bolder' }
    let ticketText = game.add.text(game.world.centerX, game.world.centerY + 75, gameOptions.awardText, ticketStyle)
    ticketText.anchor.set(0.5, 0.5)
    ticketText.left = game.world.centerX - ticketText.width / 2 // 文字居中
    this.showAwardResultGroup.add(ticketText) // 添加进结果组里
    this.showAwardGourp.visible = false // 隐藏开奖前对话框
    this.showAwardResultGroup.visible = true // 显示开奖结果对话框
  }

  // 去用券/继续抢
  handleAwardDialogBtn() {
    game.paused = false
    this.restartGame()
  }

  // 销毁
  killed(sprite) {
    sprite.kill();
  }

  // 渐变补间动画
  fade(sprite) {
    // 从显示到隐藏，补间动画时间为300毫秒，平滑式执行
    let tween = game.add.tween(sprite).to({ alpha: 0 }, 300, 'Linear', true)
    // 补间动画执行完毕后，销毁红包
    tween.onComplete.add(this.killed, this, sprite);
  }

  // 重新开始游戏
  restartGame() {
    this.leftTime = gameOptions.time
    this.leftTimeText.text = this.leftTime;
    this.canClickCoin = true
    game.state.restart()
  }
}

// 设置比例
function rfuc(n) {
  return n * gameOptions.gameWidth / 375; // 以375为基准的比例
}