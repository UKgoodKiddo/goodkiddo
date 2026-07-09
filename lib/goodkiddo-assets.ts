export const GOODKIDDO_ASSETS = {
  activityIcon: "/goodkiddo/activity-icon.png",
  bedIcon: "/goodkiddo/bed-icon.png",
  beKindTaskIcon: "/goodkiddo/task-icons/be-kind.png",
  bookIcon: "/goodkiddo/book-icon.png",
  boopCool: "/goodkiddo/boop-cool.png",
  boopHappy: "/goodkiddo/boop-happy.png",
  boopSleepy: "/goodkiddo/boop-sleepy.png",
  boopSurprised: "/goodkiddo/boop-surprised.png",
  boopTaskCompleteButton: "/goodkiddo/boop-task-complete-button.png",
  boopTaskPendingButton: "/goodkiddo/boop-task-pending-button.png",
  boopWink: "/goodkiddo/boop-wink.png",
  collectBoopsAudio: "/goodkiddo/Collectboops.m4a",
  collectBoopsButton: "/goodkiddo/collect-boops-button.png",
  brushTeethTaskIcon: "/goodkiddo/task-icons/brush-teeth.png",
  cleaningIcon: "/goodkiddo/cleaning-icon.png",
  confettiBg: "/goodkiddo/confetti-bg.png",
  dailyBonusIcon: "/goodkiddo/daily-bonus-icon.png",
  drinkWaterTaskIcon: "/goodkiddo/task-icons/drink-water.png",
  eatHealthyTaskIcon: "/goodkiddo/task-icons/eat-healthy.png",
  feedPetTaskIcon: "/goodkiddo/task-icons/feed-the-pet.png",
  foldClothesTaskIcon: "/goodkiddo/task-icons/fold-clothes.png",
  getDressedTaskIcon: "/goodkiddo/task-icons/get-dressed.png",
  greenCheckIcon: "/goodkiddo/green-check-icon.png",
  haveBathTaskIcon: "/goodkiddo/task-icons/have-a-bath.png",
  heartIcon: "/goodkiddo/heart-icon.png",
  headerLogo: "/goodkiddo/Finalheaderlogo.png",
  installAppIcon: "/goodkiddo/goodKiddoappicon.png",
  homeworkTaskIcon: "/goodkiddo/task-icons/homework.png",
  mainLogo: "/goodkiddo/main-logo.webp",
  makeBedTaskIcon: "/goodkiddo/task-icons/make-bed.png",
  makeLunchTaskIcon: "/goodkiddo/task-icons/make-lunch.png",
  packBackpackTaskIcon: "/goodkiddo/task-icons/pack-backpack.png",
  plainBoopLogo: "/goodkiddo/plain-boop-wlogo.png",
  profileIcon: "/goodkiddo/profile-icon.png",
  putLaundryAwayTaskIcon: "/goodkiddo/task-icons/put-laundry-away.png",
  readBookTaskIcon: "/goodkiddo/task-icons/read-book.png",
  rewardChooseDinnerIcon: "/goodkiddo/reward-icons/choose dinner.webp",
  rewardChooseTodaysActivityIcon: "/goodkiddo/reward-icons/choose todays activity.webp",
  rewardExtraScreenTimeIcon: "/goodkiddo/reward-icons/extra screen time.webp",
  rewardFamilyBikeRideIcon: "/goodkiddo/reward-icons/family bike ride.webp",
  rewardFamilyGameNightIcon: "/goodkiddo/reward-icons/family game night.webp",
  rewardIceCreamIcon: "/goodkiddo/reward-icons/ice cream.webp",
  rewardMovieNightIcon: "/goodkiddo/reward-icons/movie night.webp",
  rewardPocketMoneyIcon: "/goodkiddo/reward-icons/pocket money.webp",
  rewardPopcornAndFilmIcon: "/goodkiddo/reward-icons/popcorn and film.webp",
  rewardIcon: "/goodkiddo/reward-icon.png",
  rewardSurpriseRewardIcon: "/goodkiddo/reward-icons/surprise reward.webp",
  rewardSweetTreatIcon: "/goodkiddo/reward-icons/sweet treat.webp",
  rewardTripToTheParkIcon: "/goodkiddo/reward-icons/trip to the park.webp",
  screenTimeOverTaskIcon: "/goodkiddo/task-icons/screen-time-over.png",
  setTableTaskIcon: "/goodkiddo/task-icons/set-the-table.png",
  starIcon: "/goodkiddo/star-icon.png",
  sweepFloorTaskIcon: "/goodkiddo/task-icons/sweep-floor.png",
  taskCardBrushHair: "/goodkiddo/task-cards/brush-your-hair-card.png",
  taskCardBrushTeeth: "/goodkiddo/task-cards/brush-your-teeth-card.png",
  taskCardChooseHealthySnack: "/goodkiddo/task-cards/choose-healthy-snack-card.png",
  taskCardClearTheTable: "/goodkiddo/task-cards/clear-the-table-card.png",
  taskCardCloseTheDoor: "/goodkiddo/task-cards/close-the-door-card.png",
  taskCardDrinkWater: "/goodkiddo/task-cards/drink-your-water-card.png",
  taskCardFeedThePet: "/goodkiddo/task-cards/feed-the-pet-card.png",
  taskCardHaveShower: "/goodkiddo/task-cards/have-a-shower-card.png",
  taskCardMakeBed: "/goodkiddo/task-cards/make-bed-card.png",
  taskCardOrganiseBooks: "/goodkiddo/task-cards/organise-books-card.png",
  taskCardPutClothesAway: "/goodkiddo/task-cards/put-clothes-away-card.png",
  taskCardPutToysAway: "/goodkiddo/task-cards/put-toys-away-card.png",
  taskCardTurnOffLights: "/goodkiddo/task-cards/turn-off-lights-card.png",
  taskCardUseTheToilet: "/goodkiddo/task-cards/use-the-toilet-card.png",
  taskCardWashYourPlate: "/goodkiddo/task-cards/wash-your-plate-card.png",
  taskCardWaterThePlant: "/goodkiddo/task-cards/water-the-plant-card.png",
  takeOutTrashTaskIcon: "/goodkiddo/task-icons/take-out-trash.png",
  tidyUpToysTaskIcon: "/goodkiddo/task-icons/tidy-up-toys.png",
  uiBgGradient: "/goodkiddo/ui-bg-gradient.png",
  vacuumTaskIcon: "/goodkiddo/task-icons/vacuum.png",
  walkDogTaskIcon: "/goodkiddo/task-icons/walk-the-dog.png",
  washDishesTaskIcon: "/goodkiddo/task-icons/wash-dishes.png",
  waterPlantsTaskIcon: "/goodkiddo/task-icons/water-the-plants.png",
  wipeSurfacesTaskIcon: "/goodkiddo/task-icons/wipe-the-surfaces.png",
} as const;

const REWARD_ICON_MATCHERS = [
  {
    icon: GOODKIDDO_ASSETS.rewardExtraScreenTimeIcon,
    patterns: ["extra screen time", "screen time"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardIceCreamIcon,
    patterns: ["ice cream"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardSweetTreatIcon,
    patterns: ["sweet treat", "sweetie", "candy", "sweet"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardMovieNightIcon,
    patterns: ["movie night", "film night", "movie"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardPopcornAndFilmIcon,
    patterns: ["popcorn and film", "popcorn", "film"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardChooseDinnerIcon,
    patterns: ["choose dinner", "pick dinner"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardChooseTodaysActivityIcon,
    patterns: ["choose todays activity", "choose today's activity", "choose activity", "todays activity", "today's activity"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardTripToTheParkIcon,
    patterns: ["trip to the park", "park trip", "go to the park"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardFamilyBikeRideIcon,
    patterns: ["family bike ride", "bike ride"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardFamilyGameNightIcon,
    patterns: ["family game night", "game night"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardPocketMoneyIcon,
    patterns: ["pocket money", "allowance"],
  },
  {
    icon: GOODKIDDO_ASSETS.rewardSurpriseRewardIcon,
    patterns: ["surprise reward", "mystery reward", "surprise"],
  },
] as const;

export function getRewardIconPath(title: string) {
  const normalized = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

  for (const matcher of REWARD_ICON_MATCHERS) {
    if (matcher.patterns.some((pattern) => normalized.includes(pattern))) {
      return matcher.icon;
    }
  }

  return GOODKIDDO_ASSETS.rewardIcon;
}
