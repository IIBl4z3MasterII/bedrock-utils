/* 

██████╗ ██╗██╗  ██╗███████╗██████╗     ███╗   ███╗ █████╗ ███████╗████████╗███████╗██████╗ 
██╔══██╗██║██║  ██║╚══███╔╝╚════██╗    ████╗ ████║██╔══██╗██╔════╝╚══██╔══╝██╔════╝██╔══██╗
██████╔╝██║███████║  ███╔╝  █████╔╝    ██╔████╔██║███████║███████╗   ██║   █████╗  ██████╔╝
██╔══██╗██║╚════██║ ███╔╝   ╚═══██╗    ██║╚██╔╝██║██╔══██║╚════██║   ██║   ██╔══╝  ██╔══██╗
██████╔╝███████╗██║███████╗██████╔╝    ██║ ╚═╝ ██║██║  ██║███████║   ██║   ███████╗██║  ██║
╚═════╝ ╚══════╝╚═╝╚══════╝╚═════╝     ╚═╝     ╚═╝╚═╝  ╚═╝╚══════╝   ╚═╝   ╚══════╝╚═╝  ╚═╝
                                                                                           
          Data •  By: @bl4z3master
*/

export const DEATH_CAUSES = new Map([
  ["fall", "fall"],
  ["void", "void"], 
  ["fire", "fire"],
  ["lava", "lava"],
  ["drowning", "drowning"],
  ["explosion", "explosion"],
  ["projectile", "arrow"],
  ["magic", "magic"],
  ["wither", "wither"],
  ["starve", "starve"],
  ["contact", "cactus"],
  ["anvil", "anvil"],
  ["magma", "magma"],
  ["lightning", "lightning"],
  ["freezing", "freeze"],
  ["cramming", "cramming"],
  ["flyIntoWall", "kinetic"],
  ["dryout", "dryout"],
  ["temperature", "temperature"],
  ["sonicBoom", "sonic_boom"],
]);

export const TOOL_REGISTRY = new Map([
  ["wooden_pickaxe", { material: "wooden", type: "pickaxe" }],
  ["stone_pickaxe", { material: "stone", type: "pickaxe" }],
  ["iron_pickaxe", { material: "iron", type: "pickaxe" }],
  ["golden_pickaxe", { material: "golden", type: "pickaxe" }],
  ["diamond_pickaxe", { material: "diamond", type: "pickaxe" }],
  ["netherite_pickaxe", { material: "netherite", type: "pickaxe" }],

  ["wooden_sword", { material: "wooden", type: "sword" }],
  ["stone_sword", { material: "stone", type: "sword" }],
  ["iron_sword", { material: "iron", type: "sword" }],
  ["golden_sword", { material: "golden", type: "sword" }],
  ["diamond_sword", { material: "diamond", type: "sword" }],
  ["netherite_sword", { material: "netherite", type: "sword" }],

  ["wooden_axe", { material: "wooden", type: "axe" }],
  ["stone_axe", { material: "stone", type: "axe" }],
  ["iron_axe", { material: "iron", type: "axe" }],
  ["golden_axe", { material: "golden", type: "axe" }],
  ["diamond_axe", { material: "diamond", type: "axe" }],
  ["netherite_axe", { material: "netherite", type: "axe" }],

  ["wooden_shovel", { material: "wooden", type: "shovel" }],
  ["stone_shovel", { material: "stone", type: "shovel" }],
  ["iron_shovel", { material: "iron", type: "shovel" }],
  ["golden_shovel", { material: "golden", type: "shovel" }],
  ["diamond_shovel", { material: "diamond", type: "shovel" }],
  ["netherite_shovel", { material: "netherite", type: "shovel" }],

  ["wooden_hoe", { material: "wooden", type: "hoe" }],
  ["stone_hoe", { material: "stone", type: "hoe" }],
  ["iron_hoe", { material: "iron", type: "hoe" }],
  ["golden_hoe", { material: "golden", type: "hoe" }],
  ["diamond_hoe", { material: "diamond", type: "hoe" }],
  ["netherite_hoe", { material: "netherite", type: "hoe" }],

  ["trident", { material: "special", type: "trident" }],
  ["crossbow", { material: "special", type: "crossbow" }],
  ["bow", { material: "special", type: "bow" }],
  ["mace", { material: "special", type: "mace" }],
]);

export const DEATH_MESSAGES = {
  void: [
    "§c%player% se perdió en el vacío!",
    "§c%player% descubrió que el vacío no tiene fondo...",
    "§c%player% decidió explorar el infinito",
    "§c%player% fue absorbido por la oscuridad",
    "§c%player% cayó fuera del mundo",
  ],
  fall: [
    "§c%player% olvidó que la gravedad existe",
    "§c%player% pensó que podía volar",
    "§c¡Splat! %player% se estrelló contra el suelo",
    "§c%player% debería haber traído un paracaídas",
    "§c%player% calculó mal ese salto",
    "§c%player% descubrió la ley de gravedad",
    "§c%player% no midió bien la distancia",
  ],
  fire: [
    "§c%player% se convirtió en barbacoa",
    "§c%player% jugó con fuego... y perdió",
    "§c%player% fue consumido por las llamas",
    "§c%player% se derritió como un helado",
    "§c%player% no resistió el calor",
  ],
  lava: [
    "§c%player% pensó que la lava era una piscina",
    "§c%player% se dio un baño muy caliente",
    "§c%player% nadó en el lugar equivocado",
    "§c%player% se convirtió en parte del Nether",
    "§c%player% probó la temperatura de la lava",
  ],
  drowning: [
    "§c%player% olvidó que necesitaba respirar",
    "§c%player% encontró Atlantis... permanentemente",
    "§c%player% debería haber traído branquias",
    "§c%player% se quedó sin burbujas",
    "§c%player% decidió vivir bajo el mar",
  ],
  explosion: [
    "§c%player% explotó en mil pedazos",
    "§c¡BOOM! %player% ya no está con nosotros",
    "§c%player% se acercó demasiado a un Creeper",
    "§c%player% descubrió que la TNT es peligrosa",
  ],
  arrow: [
    "§c%player% fue atravesado por una flecha",
    "§c%player% no vio venir esa flecha",
    "§c%player% fue convertido en alfiletero",
    "§c%player% recibió una entrega especial",
  ],
  magic: [
    "§c%player% sucumbió ante la magia",
    "§c%player% fue víctima de un hechizo mortal",
    "§c%player% no resistió el poder arcano",
  ],
  wither: [
    "§c%player% se marchitó hasta la muerte",
    "§c%player% fue consumido por la oscuridad del Wither",
    "§c%player% no sobrevivió al efecto Wither",
  ],
  starve: [
    "§c%player% se olvidó de comer",
    "§c%player% murió de hambre",
    "§c%player% debería haber hecho más provisiones",
  ],
  cactus: [
    "§c%player% abrazó un cactus",
    "§c%player% descubrió que los cactus son puntiagudos",
    "§c%player% se pinchó hasta morir",
  ],
  anvil: [
    "§c%player% fue aplastado por un yunque",
    "§c¡BONK! %player% miró hacia arriba muy tarde",
    "§c%player% tuvo un encuentro cercano con la gravedad y un yunque",
  ],
  magma: [
    "§c%player% descubrió que el magma quema",
    "§c%player% bailó sobre magma",
    "§c%player% pensó que el magma era seguro",
  ],
  lightning: [
    "§c%player% fue alcanzado por un rayo",
    "§c¡ZAP! %player% fue electrocutado",
    "§c%player% atrajo la ira de Zeus",
  ],
  freeze: [
    "§c%player% se congeló hasta morir",
    "§c%player% se convirtió en un cubito de hielo",
    "§c%player% debió abrigarse mejor",
  ],
  cramming: [
    "§c%player% fue aplastado por demasiadas entidades",
    "§c%player% no tenía espacio para respirar",
  ],
  kinetic: [
    "§c%player% chocó contra una pared a gran velocidad",
    "§c%player% no calculó bien su aterrizaje con élitros",
  ],
  dryout: [
    "§c%player% se secó fuera del agua",
    "§c%player% necesitaba agua para sobrevivir",
  ],
  temperature: [
    "§c%player% no soportó la temperatura extrema",
    "§c%player% murió por el cambio de temperatura",
  ],
  sonic_boom: [
    "§c%player% fue desintegrado por una onda sónica",
    "§c%player% no sobrevivió al grito del Warden",
  ],

  pvp: {
    suicide: [
      "§c%player% se eliminó a sí mismo",
      "§c%player% decidió terminar con su propia existencia",
      "§c%player% descubrió una forma creativa de suicidarse",
      "§c%player% no pudo consigo mismo",
      "§c%player% se auto-eliminó del juego",
    ],
    weapon: {
      sword: [
        "§c%killer% atravesó a %player% con su %weapon%",
        "§c%killer% hizo sushi de %player% con su %weapon%",
        "§c%player% probó el filo de la %weapon% de %killer%",
        "§c%killer% demostró su habilidad con la %weapon% en %player%",
      ],
      axe: [
        "§c%killer% taló a %player% con su %weapon%",
        "§c%player% fue partido en dos por la %weapon% de %killer%",
        "§c%killer% convirtió a %player% en leña con su %weapon%",
        "§c%killer% le dio un hachazo letal a %player%",
      ],
      pickaxe: [
        "§c%killer% minó a %player% con su %weapon%",
        "§c%player% fue perforado por la %weapon% de %killer%",
        "§c%killer% encontró un nuevo uso para su %weapon% en %player%",
        "§c%killer% excavó la tumba de %player% con su %weapon%",
      ],
      shovel: [
        "§c%killer% enterró a %player% con su %weapon%",
        "§c%player% fue golpeado con la %weapon% de %killer%",
        "§c%killer% cavó la tumba de %player% con su %weapon%",
      ],
      hoe: [
        "§c%killer% cultivó a %player% con su %weapon%",
        "§c%player% fue labrado por la %weapon% de %killer%",
        "§c%killer% encontró un uso inesperado para su %weapon% en %player%",
      ],
      trident: [
        "§c%killer% ensartó a %player% con su %weapon%",
        "§c%player% fue atravesado por el %weapon% de %killer%",
        "§c%killer% demostró su puntería con el %weapon%",
      ],
      bow: [
        "§c%killer% acertó un tiro perfecto a %player%",
        "§c%player% fue cazado por %killer% con su %weapon%",
        "§c%killer% tiene una puntería letal con su %weapon%",
      ],
      crossbow: [
        "§c%killer% disparó certero a %player%",
        "§c%player% no esquivó la ballesta de %killer%",
        "§c%killer% cargó y descargó su %weapon% en %player%",
      ],
      mace: [
        "§c%killer% aplastó a %player% con su %weapon%",
        "§c%player% sintió todo el peso de la %weapon% de %killer%",
        "§c%killer% demostró el poder de su %weapon%",
      ],
    },
    default: [
      "§c%killer% mandó al lobby a %player%",
      "§c%killer% le dio un viaje gratis al lobby a %player%",
      "§c%player% fue destruido por %killer%",
      "§c%killer% le enseñó quién manda a %player%",
      "§c%player% probó el poder de %killer%",
      "§c%killer% sacó del servidor a %player%",
      "§c%player% fue humillado por %killer%",
      "§c%killer% le dio una lección a %player%",
      "§c%player% deseará no haberse cruzado con %killer%",
      "§c%killer% mandó a dormir a %player%",
    ],
  },

  mob: {
    zombie: [
      "§c%player% fue devorado por un zombie",
      "§c%player% se unió al ejército de no-muertos",
      "§c%player% no pudo escapar de los zombies",
    ],
    zombie_villager: [
      "§c%player% fue infectado por un aldeano zombie",
      "§c%player% cayó ante un aldeano convertido",
    ],
    husk: [
      "§c%player% fue momificado por un Husk",
      "§c%player% se secó en el desierto",
    ],
    drowned: [
      "§c%player% fue arrastrado a las profundidades",
      "§c%player% fue víctima de las profundidades marinas",
      "§c%player% no pudo nadar lo suficientemente rápido",
    ],
    skeleton: [
      "§c%player% fue acribillado por un esqueleto",
      "§c%player% recibió demasiadas flechas",
      "§c%player% fue el blanco perfecto",
    ],
    stray: [
      "§c%player% fue congelado por un Stray",
      "§c%player% sintió el frío de las flechas heladas",
    ],
    wither_skeleton: [
      "§c%player% fue marchitado por un esqueleto del Nether",
      "§c%player% no sobrevivió al Nether",
    ],
    creeper: [
      "§c%player% no oyó el 'ssssss'",
      "§c%player% abrazó a un Creeper",
      "§c¡BOOM! %player% voló por los aires",
    ],
    spider: [
      "§c%player% fue el almuerzo de una araña",
      "§c%player% fue atrapado en la telaraña equivocada",
      "§c%player% no vio venir esas ocho patas",
    ],
    cave_spider: [
      "§c%player% fue envenenado por una araña de cueva",
      "§c%player% exploró demasiado profundo",
    ],

    blaze: [
      "§c%player% fue incinerado por un Blaze",
      "§c%player% se convirtió en cenizas",
      "§c%player% no resistió las bolas de fuego",
    ],
    ghast: [
      "§c%player% fue alcanzado por una bola de fuego",
      "§c%player% no esquivó al Ghast a tiempo",
      "§c%player% escuchó el último lamento",
    ],
    magma_cube: [
      "§c%player% fue absorbido por un Cubo de Magma",
      "§c%player% se derritió al tocar lava viviente",
    ],
    piglin: [
      "§c%player% enfadó a los piglins",
      "§c%player% olvidó ponerse armadura dorada",
    ],
    piglin_brute: [
      "§c%player% fue aplastado por un Piglin Bruto",
      "§c%player% subestimó la fuerza bruta",
    ],
    hoglin: [
      "§c%player% fue embestido por un Hoglin",
      "§c%player% se convirtió en bacon",
    ],
    zoglin: [
      "§c%player% fue destrozado por un Zoglin zombificado",
      "§c%player% no pudo domar la bestia",
    ],

    enderman: [
      "§c%player% miró a los ojos equivocados",
      "§c%player% molestó a un Enderman",
      "§c%player% fue teletransportado a su muerte",
    ],
    endermite: [
      "§c%player% fue devorado por un diminuto Endermite",
      "§c%player% subestimó al pequeño parásito",
    ],
    shulker: [
      "§c%player% flotó hasta su muerte",
      "§c%player% fue elevado por un Shulker",
      "§c%player% no pudo aterrizar a salvo",
    ],
    ender_dragon: [
      "§c%player% fue rostizado por el Dragón del End",
      "§c%player% no estaba listo para el jefe final",
    ],

    wither: [
      "§c%player% fue desintegrado por el Wither",
      "§c%player% sucumbió ante el poder del Wither",
      "§c%player% no sobrevivió al apocalipsis",
    ],

    witch: [
      "§c%player% fue embrujado hasta la muerte",
      "§c%player% bebió la poción equivocada",
      "§c%player% fue víctima de la magia oscura",
    ],
    phantom: [
      "§c%player% debería haber dormido más",
      "§c%player% fue cazado desde los cielos",
      "§c%player% ignoró demasiado tiempo la cama",
    ],
    slime: [
      "§c%player% fue absorbido por un Slime",
      "§c%player% se ahogó en gelatina",
    ],
    silverfish: [
      "§c%player% fue devorado por Lepismas",
      "§c%player% rompió el bloque equivocado",
    ],

    guardian: [
      "§c%player% fue atravesado por el rayo láser",
      "§c%player% no respetó al guardián del océano",
    ],
    elder_guardian: [
      "§c%player% fue maldecido por el Guardián Anciano",
      "§c%player% sintió la fatiga minera eterna",
    ],
    pufferfish: [
      "§c%player% murió por un pez globo XD",
      "§c%player% fue envenenado por un pez inflado",
    ],

    bee: [
      "§c%player% fue picado hasta la muerte",
      "§c%player% molestó a la colmena equivocada",
    ],
    wolf: [
      "§c%player% fue devorado por lobos",
      "§c%player% no debió molestar a la manada",
    ],
    polar_bear: [
      "§c%player% fue destrozado por un oso polar",
      "§c%player% se acercó demasiado a las crías",
    ],
    panda: [
      "§c%player% fue aplastado por un panda enfadado",
      "§c%player% molestó al panda equivocado",
    ],
    goat: [
      "§c%player% fue embestido por una cabra",
      "§c%player% voló por los aires montaña abajo",
    ],
    iron_golem: [
      "§c%player% fue lanzado por los aires",
      "§c%player% enfadó al protector de la aldea",
    ],

    warden: [
      "§c%player% despertó al Warden... y no vivió para contarlo",
      "§c%player% fue silenciado por el guardián de las profundidades",
      "§c%player% no debió hacer tanto ruido",
    ],

    breeze: [
      "§c%player% fue arrastrado por el viento",
      "§c%player% voló demasiado alto por culpa de un Breeze",
    ],
    bogged: [
      "§c%player% fue envenenado por un Bogged",
      "§c%player% se perdió en el pantano",
    ],
    creaking: [
      "§c%player% fue acechado por un Creaking",
      "§c%player% no debió caminar solo en el bosque pálido",
      "§c%player% fue cazado por la criatura del bosque",
      "§c%player% no pudo escapar del Creaking",
      "§c%player% se convirtió en presa del guardián del bosque",
    ],
    tnt: [
      "§c%player% jugó con TNT... y perdió",
      "§c¡BOOM! %player% voló en pedazos",
      "§c%player% encendió la mecha equivocada",
      "§c%player% se convirtió en fuegos artificiales",
      "§c%player% no calculó bien la distancia de la explosión",
      "§c%player% descubrió que la TNT no es decorativa",
      "§c%player% hizo ka-boom y desapareció",
      "§c%player% se acercó demasiado a la dinamita",
      "§c%player% probó el poder explosivo de primera mano",
      "§c%player% encendió más de lo que podía manejar",
    ],
  },

  other: [
    "§c%player% ha tenido un final desafortunado",
    "§c%player% nos ha dejado de manera misteriosa",
    "§cDescansa en paz, %player%",
    "§c%player% encontró una forma creativa de morir",
  ],
};

export const UNKNOWN_ENTITY_MESSAGES = [
  "§c%player% fue eliminado por una criatura misteriosa",
  "§c%player% encontró algo que no debería existir",
  "§c%player% fue víctima de lo desconocido",
  "§c%player% se topó con una entidad extraña",
  "§c%player% fue derrotado por algo inexplicable",
  "§c%player% descubrió una nueva forma de morir",
  "§c%player% fue atacado por una criatura no identificada",
];

export const UNKNOWN_DEATH_CAUSE_MESSAGES = [
  "§c%player% murió por causas misteriosas",
  "§c%player% encontró una nueva forma de partir",
  "§c%player% ha tenido un final muy peculiar",
  "§c%player% fue víctima de circunstancias extrañas",
  "§c%player% descubrió un nuevo tipo de peligro",
  "§c%player% murió de una manera muy creativa",
  "§c%player% nos sorprendió con su muerte única",
];
