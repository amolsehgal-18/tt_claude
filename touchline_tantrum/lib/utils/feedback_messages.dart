class FeedbackProvider {
  static final Map<String, List<String>> _boardFeedback = {
    'victory_high': [
      "A phenomenal season! Your leadership has brought us unprecedented success. We couldn't be happier.",
      "Absolutely brilliant! You've exceeded all our expectations. A masterclass in management.",
      "Legendary status confirmed! The board is ecstatic with the results and your vision.",
    ],
    'victory_medium': [
      "A successful season and you've met the objective. Well done. We look forward to building on this.",
      "Good job. You delivered what was asked. The board is satisfied with the performance.",
      "You've proven your capabilities by meeting the season's goals. A solid performance.",
    ],
    'sacked_objective_met': [
      "You achieved the objective, but at what cost? The internal turmoil made your position untenable.",
      "Results on the pitch were there, but you lost the faith of the fans and players. We had no choice.",
      "A strange, bittersweet end. We thank you for the success, but the club's stability must come first."
    ],
    'sacked_medium': [
      "A difficult season with a disappointing end. We saw glimpses of potential, but results are paramount.",
      "Ultimately, the league position wasn't good enough, and we had to make a change.",
      "It was a tough decision, but the team's performance didn't meet the required standard.",
    ],
    'sacked_low': [
      "The results speak for themselves. This was a disastrous season and your position became untenable.",
      "We had to make a change. The team's performance was consistently below the required standard.",
      "A season to forget. The board has lost all confidence in your ability to lead this club.",
    ]
  };

  static final Map<String, List<String>> _squadFeedback = {
    'victory_high': [
      "The gaffer is a tactical genius! Best manager we've ever had. The dressing room is buzzing.",
      "We'd run through a brick wall for the boss. The atmosphere in the squad is electric.",
      "What a season! The manager's belief in us made all the difference. We're a proper team.",
    ],
    'victory_medium': [
      "We got the job done. The manager kept us focused and we delivered. A good season's work.",
      "The gaffer's methods worked. We achieved our goal and that's what matters.",
      "We're pleased with the season's outcome. The manager led us well when it counted.",
    ],
    'sacked_objective_met': [
      "Winning the league and getting sacked on the same day... what a bizarre season. We're exhausted.",
      "The gaffer got us over the line, but the dressing room was divided. A change was probably for the best.",
      "We won, but it never felt like a total victory. The atmosphere was toxic by the end."
    ],
    'sacked_medium': [
      "We're gutted about the final result. We gave it our all for the manager, but it wasn't enough.",
      "It's a shame how it ended. The manager had our respect, but the results just didn't come.",
      "A tough pill to swallow. We felt we were making progress, but the league table doesn't lie.",
    ],
    'sacked_low': [
      "The dressing room was lost long ago. A change was needed. The atmosphere was terrible.",
      "We never clicked with the manager's tactics or methods. It's the right decision for the club.",
      "It's a relief, to be honest. The morale was at rock bottom. We need a fresh start.",
    ]
  };

  static final Map<String, List<String>> _fanFeedback = {
    'victory_high': [
      "We are the champions! Best manager in the world! Build the statue now!",
      "I've never been happier as a fan. This manager is a legend in the making!",
      "This is the best team I've ever seen! The manager has us playing liquid football!",
    ],
    'victory_medium': [
      "We did it! Not always pretty, but we got the job done. The manager deserves credit.",
      "Objective achieved. Can't complain about that! A solid, if unspectacular, season.",
      "Fair play to the manager, they delivered. Now let's push on to the next level.",
    ],
     'sacked_objective_met': [
      "Champions, but at what cost? He alienated the entire fanbase. We celebrate the title, but not the man.",
      "He won us the league, and I'll thank him for that, but I'm not sad to see him go. He never understood this club.",
      "A title is a title, but football is about more than that. The disconnect was just too big."
    ],
    'sacked_medium': [
      "Heartbreaking. We were so close. Some fans will feel the manager deserved more time.",
      "You can't argue with the league table, but it feels like we had some bad luck. A tough one to take.",
      "Another manager bites the dust. The problems at this club run deeper than the dugout.",
    ],
    'sacked_low': [
      "Get out of our club! A complete and utter failure. Good riddance!",
      "Finally! The decision should have been made months ago. A truly dreadful season.",
      "Taxi for the manager! Thanks for nothing. We deserve better than this.",
    ]
  };

  static String getFeedback(String stakeholder, bool isWon, double rating, bool objectiveMet) {
    String category;
    if (isWon) {
      category = rating >= 0.7 ? 'victory_high' : 'victory_medium';
    } else {
      if (objectiveMet) {
        category = 'sacked_objective_met';
      } else {
        category = rating >= 0.4 ? 'sacked_medium' : 'sacked_low';
      }
    }

    List<String> messages;
    switch (stakeholder) {
      case 'board':
        messages = _boardFeedback[category] ?? ['No comment.'];
        break;
      case 'squad':
        messages = _squadFeedback[category] ?? ['The players are unavailable for comment.'];
        break;

      case 'fans':
        messages = _fanFeedback[category] ?? ['The fans are protesting outside the stadium.'];
        break;
      default:
        messages = ['...'];
    }
    
    return (messages..shuffle()).first;
  }
}
