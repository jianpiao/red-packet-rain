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
  maxSpeed: 1500,
  minSpeed: 800,
  max: 95,
  time: 1, // 游戏时长
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
  }

  // 资源预加载，会在phaser预加载期间执行，可以实时监控资源加载的进度
  preload() {
    if (typeof (GAME) !== "undefined") {
      this.load.baseURL = GAME + "/";
    }

    // 如果是桌面端则自适应
    if (!game.device.desktop) {
      this.scale.scaleMode = Phaser.ScaleManager.EXACT_FIT;
      this.scale.forcePortrait = true;
      this.scale.refresh();
    }

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

    // 背景图
    let launchBg = game.add.sprite(0, 0, 'launchBg');
    launchBg.width = game.width;
    launchBg.height = game.height;

    // 开始按钮背景
    this.gameStartButton = game.add.button(game.world.centerX, game.world.centerY + 200, "gameStartBtn", function () {
      this.gameStartButton.visible = false
      this.gameStartText.visible = false
      this.cursorHandle.visible = false
      this.startGame()
    }, this);
    this.gameStartButton.anchor.set(0.5, 0)

    // 游戏开始文案
    const gameStartTextStyle = { fill: '#FFF', fontSize: '30px', fontWeight: 'bolder' }
    this.gameStartText = game.add.text(game.world.centerX, game.world.centerY + 249, '开始游戏', gameStartTextStyle)
      .anchor.set(0.5, 0.5)

    // 手指
    this.cursorHandle = game.add.sprite(game.world.centerX - 36, game.world.centerY + 240, 'cursorAnimation')
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
    this.maxWidth = game.width + 300;
    game.time.events.loop(Phaser.Timer.SECOND * gameOptions.rate, this.createRedPacket, this);

    // 初始化游戏时间
    this.leftTime = gameOptions.time
    // 剩余时间文案
    this.leftTimeText = game.add.text(0, 0, this.leftTime, { fill: '#FFF', fontSize: '40px', fontWeight: 'bolder' })
    this.leftTimeText.scale.setTo(rfuc(1))
    this.leftTimeText.fixedToCamera = true;
    this.leftTimeText.cameraOffset.setTo(game.camera.width - rfuc(80), rfuc(20));

    // 创建一个关闭组
    this.closeGroup = game.add.group()

    // 遮罩
    const hexGraphics = new Phaser.Graphics().beginFill(0x000000, 0.5).drawRect(0, 0, gameOptions.width, gameOptions.height);
    this.pausedMask = game.add.sprite(0, 0, hexGraphics.generateTexture())
    this.closeGroup.add(this.pausedMask)
    // 退出游戏对话框
    this.exitDialog = game.add.sprite(rfuc(62), rfuc(150), 'dialogExit')
    this.closeGroup.add(this.exitDialog)
    // 退出按钮
    this.exitButton = game.add.button(rfuc(80), rfuc(315), 'buttonExit')
    this.closeGroup.add(this.exitButton)
    // 取消按钮
    this.cancelButton = game.add.button(rfuc(200), rfuc(315), 'buttonCancel')
    this.closeGroup.add(this.cancelButton)

    // 设置组默认为不显示
    this.closeGroup.visible = false

    // 重复切换帧，第一个参数是一帧间隔时长
    game.time.events.repeat(Phaser.Timer.SECOND, this.leftTime, this.refreshTime, this)

    //添加按钮,并绑定事件
    const closeImg = game.add.button(rfuc(20), rfuc(20), 'close', function () {
      game.paused = true
      this.gameAudio.pause()
      this.closeGroup.visible = true
      // 添加点击事件
      game.input.onDown.add(this.handleExitGame, this)
    }.bind(this))
  }

  // 结束游戏
  handleExitGame() {
    let exitRect = new Phaser.Rectangle(rfuc(80), rfuc(315), 194, 66).copyFrom(this.exitButton);
    let cancelRect = new Phaser.Rectangle(rfuc(200), rfuc(315), 194, 66).copyFrom(this.cancelButton);
    if (cancelRect.contains(game.input.x, game.input.y)) { // 监听取消事件
      game.input.onDown.remove(this.handleExitGame, this)
      this.closeGroup.visible = false
      game.paused = false
      this.gameAudio.play() // 继续游戏
    } else if (exitRect.contains(game.input.x, game.input.y)) { // 监听退出事件
      game.input.onDown.remove(this.handleExitGame, this)
      this.closeGroup.visible = false
      game.paused = false
      this.restartGame() // 退回启动页（重新开始）
    }
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

  // 创建红包
  createRedPacket() {
    const redPacket = this.redPacketGroup.getFirstExists(false);
    if (redPacket) {
      redPacket.events.onInputDown.removeAll();
      redPacket.loadTexture(this.config.selfPic)
      redPacket.alpha = 1; // 设置透明度为1
      redPacket.angle = 0 // 红包旋转角度
      redPacket.reset(game.rnd.integerInRange(100, this.maxWidth), 100)  //红包生成的位置
      redPacket.body.velocity.x = game.rnd.integerInRange(-500, -350);   //红包移动的速度
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
    sprite.play(gameOptions.selfPic, 40, false);
    // 帧动画切换完毕后，执行补间动画，让红包渐变消失
    anim.onComplete.add(this.fade, this, sprite)
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
    const openDialog = game.add.sprite(rfuc(62), rfuc(150), 'openRedpacket')
    // 开奖硬币图
    this.showAwardCoin = game.add.sprite(rfuc(130), rfuc(300), 'open')
    // 支持点击
    this.showAwardCoin.inputEnabled = true;
    // 将上面添加进组里，方便统一管理
    this.showAwardGourp.add(pausedMask)
    this.showAwardGourp.add(openDialog)
    this.showAwardGourp.add(this.showAwardCoin)

    // 结果背景图
    const result = game.add.sprite(rfuc(0), rfuc(120), 'redpacketResult')
    // 去用券按钮
    this.showAwardUserTicket = game.add.sprite(rfuc(78), rfuc(445), 'buttonUseTicket')
    // 继续抢按钮
    this.showAwardGoOn = game.add.sprite(rfuc(198), rfuc(445), 'buttonContinue')
    // 将上面添加进组里，方便统一管理
    this.showAwardResultGroup.add(result)
    this.showAwardResultGroup.add(this.showAwardUserTicket)
    this.showAwardResultGroup.add(this.showAwardGoOn)
    // 先设置抽奖结果为隐藏
    this.showAwardResultGroup.visible = false
    // 添加按钮点击事件
    game.input.onDown.add(this.handleOpenCoin, this)
  }

  // 点击拆红包按钮
  handleOpenCoin() {
    //游戏暂停时,点击事件无效,只能通过这种画热点的形式来绑定事件
    let openRect = new Phaser.Rectangle(rfuc(130), rfuc(315), 239, 239).copyFrom(this.showAwardCoin);
    // 点击开奖
    if (openRect.contains(game.input.x, game.input.y)) {
      game.paused = false
      this.openCoin = game.add.tween(this.showAwardCoin).to({ angle: -20 }, 100, 'Linear', true, 0, 6, false);
      this.openCoin.onComplete.add(this.getAwardResult, this)
    }
  }

  // 开奖结果
  getAwardResult() {
    game.paused = true
    document.getElementById('audioOpen').play()
    let ticketStyle = { fill: '#ffe67d', fontSize: '46px', fontWeight: 'bolder' }
    let ticketText = game.add.text(0, rfuc(338), gameOptions.awardText, ticketStyle)
    ticketText.left = game.world.centerX - ticketText.width / 2 // 文字居中
    this.showAwardResultGroup.add(ticketText) // 添加进结果组里
    this.showAwardGourp.visible = false // 隐藏开奖前对话框
    this.showAwardResultGroup.visible = true // 显示开奖结果对话框
    game.input.onDown.add(this.handleAwardDialogBtn, this) // 添加开奖结果按钮点击事件
  }

  // 开奖按钮点击事件
  handleAwardDialogBtn() {
    let userTicketRect = new Phaser.Rectangle(rfuc(78), rfuc(445), 194, 66).copyFrom(this.showAwardUserTicket);
    let continueRect = new Phaser.Rectangle(rfuc(198), rfuc(445), 194, 66).copyFrom(this.showAwardGoOn);

    if (userTicketRect.contains(game.input.x, game.input.y)) { // 去用券
      game.input.onDown.remove(this.handleAwardDialogBtn, this);
      game.paused = false
      this.restartGame()
    } else if (continueRect.contains(game.input.x, game.input.y)) { // 继续抢
      game.input.onDown.remove(this.handleAwardDialogBtn, this);
      game.paused = false
      this.restartGame()
    }
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
    game.state.restart()
  }
}

// 设置比例
function rfuc(n) {
  return n * gameOptions.gameWidth / 375; // 以375为基准的比例
}