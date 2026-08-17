"""
Seed command: python manage.py seed_data
Creates all 10 learning modules, lessons, games, and quizzes with rich sample content.
"""
from django.core.management.base import BaseCommand
from learning.models import LearningModule, Lesson
from games.models import Game
from quiz.models import Quiz, Question, Answer


MODULES = [
    {
        'slug': 'alphabet', 'title': 'Alphabet', 'module_type': 'alphabet',
        'description': 'Learn the ABC from A to Z with fun pictures and sounds!',
        'icon_emoji': '🔤', 'color_hex': '#FF6B6B', 'size_bytes': 15_000_000, 'order': 1,
    },
    {
        'slug': 'numbers', 'title': 'Numbers', 'module_type': 'numbers',
        'description': 'Count from 1 to 20 and learn to recognize numbers!',
        'icon_emoji': '🔢', 'color_hex': '#4ECDC4', 'size_bytes': 12_000_000, 'order': 2,
    },
    {
        'slug': 'colors', 'title': 'Colors', 'module_type': 'colors',
        'description': 'Discover all the beautiful colors of the rainbow!',
        'icon_emoji': '🎨', 'color_hex': '#FFE66D', 'size_bytes': 10_000_000, 'order': 3,
    },
    {
        'slug': 'shapes', 'title': 'Shapes', 'module_type': 'shapes',
        'description': 'Circle, square, triangle and more - learn all shapes!',
        'icon_emoji': '⭐', 'color_hex': '#A29BFE', 'size_bytes': 8_000_000, 'order': 4,
    },
    {
        'slug': 'general-awareness', 'title': 'General Awareness', 'module_type': 'general_awareness',
        'description': 'Explore Animals, Birds, Plants, Food, Vehicles, Weather, Seasons, Helpers & more!',
        'icon_emoji': '🌎', 'color_hex': '#00CEC9', 'size_bytes': 16_000_000, 'order': 5,
    },
    {
        'slug': 'animals', 'title': 'Animals', 'module_type': 'animals',
        'description': 'Meet amazing animals and hear their sounds!',
        'icon_emoji': '🐾', 'color_hex': '#55EFC4', 'size_bytes': 25_000_000, 'order': 6,
    },
    {
        'slug': 'fruits', 'title': 'Fruits & Vegetables', 'module_type': 'fruits',
        'description': 'Learn about yummy fruits and vegetables!',
        'icon_emoji': '🍎', 'color_hex': '#FD79A8', 'size_bytes': 18_000_000, 'order': 7,
    },
    {
        'slug': 'words', 'title': 'Basic Words', 'module_type': 'words',
        'description': 'Learn simple everyday words!',
        'icon_emoji': '💬', 'color_hex': '#FDCB6E', 'size_bytes': 10_000_000, 'order': 8,
    },
    {
        'slug': 'stories', 'title': 'Stories', 'module_type': 'stories',
        'description': 'Fun short stories with pictures and audio narration!',
        'icon_emoji': '📖', 'color_hex': '#6C5CE7', 'size_bytes': 30_000_000, 'order': 9,
    },
    {
        'slug': 'mathematics', 'title': 'Mathematics', 'module_type': 'mathematics',
        'description': 'Simple addition and subtraction made fun!',
        'icon_emoji': '➕', 'color_hex': '#00B894', 'size_bytes': 14_000_000, 'order': 10,
    },
    {
        'slug': 'english', 'title': 'English', 'module_type': 'english',
        'description': 'Learn words, sentences and simple English!',
        'icon_emoji': '🇬🇧', 'color_hex': '#0984E3', 'size_bytes': 20_000_000, 'order': 11,
    },
]

ALPHABET_LESSONS = [
    {
        'title': f'Letter {letter}',
        'order': i,
        'content_json': {
            'type': 'alphabet_lesson',
            'letter': letter,
            'word': word,
            'emoji': emoji,
            'slides': [
                {'type': 'letter_display', 'letter': letter, 'uppercase': letter, 'lowercase': letter.lower()},
                {'type': 'word_association', 'word': word, 'emoji': emoji},
                {'type': 'tracing', 'letter': letter},
                {'type': 'matching', 'options': [letter, letter.lower(), 'X', 'x'], 'correct': letter},
            ]
        },
        'duration_seconds': 120,
    }
    for i, (letter, word, emoji) in enumerate([
        ('A', 'Apple', '🍎'), ('B', 'Ball', '⚽'), ('C', 'Cat', '🐱'),
        ('D', 'Dog', '🐶'), ('E', 'Elephant', '🐘'), ('F', 'Fish', '🐟'),
        ('G', 'Grapes', '🍇'), ('H', 'Hat', '🎩'), ('I', 'Ice cream', '🍦'),
        ('J', 'Juice', '🧃'), ('K', 'Kite', '🪁'), ('L', 'Lion', '🦁'),
        ('M', 'Monkey', '🐒'), ('N', 'Nest', '🪺'), ('O', 'Orange', '🍊'),
        ('P', 'Penguin', '🐧'), ('Q', 'Queen', '👸'), ('R', 'Rainbow', '🌈'),
        ('S', 'Sun', '☀️'), ('T', 'Tiger', '🐯'), ('U', 'Umbrella', '☂️'),
        ('V', 'Violin', '🎻'), ('W', 'Whale', '🐋'), ('X', 'X-ray', '🦴'),
        ('Y', 'Yak', '🐃'), ('Z', 'Zebra', '🦓'),
    ])
]

NUMBER_LESSONS = [
    {
        'title': f'Number {n}',
        'order': i,
        'content_json': {
            'type': 'number_lesson',
            'number': n,
            'emoji': emoji,
            'slides': [
                {'type': 'number_display', 'number': n, 'word': word},
                {'type': 'counting', 'count': n, 'item_emoji': emoji},
                {'type': 'tracing', 'number': n},
            ]
        },
        'duration_seconds': 90,
    }
    for i, (n, word, emoji) in enumerate([
        (1, 'One', '🌟'), (2, 'Two', '🌙'), (3, 'Three', '⭐'),
        (4, 'Four', '🦋'), (5, 'Five', '🌸'), (6, 'Six', '🐝'),
        (7, 'Seven', '🌈'), (8, 'Eight', '🎈'), (9, 'Nine', '🍭'),
        (10, 'Ten', '🎉'), (11, 'Eleven', '🦜'), (12, 'Twelve', '🐢'),
        (13, 'Thirteen', '🦊'), (14, 'Fourteen', '🌺'), (15, 'Fifteen', '🐬'),
        (16, 'Sixteen', '🌻'), (17, 'Seventeen', '🦄'), (18, 'Eighteen', '🍀'),
        (19, 'Nineteen', '🦁'), (20, 'Twenty', '🚀'),
    ])
]

COLOR_LESSONS = [
    {
        'title': f'Color: {color}', 'order': i,
        'content_json': {'type': 'color_lesson', 'color': color, 'hex': hex_val, 'emoji': emoji,
                         'slides': [{'type': 'color_display', 'color': color, 'hex': hex_val},
                                    {'type': 'find_color', 'color': color, 'items': [emoji, '❓', '❓']}]},
        'duration_seconds': 60,
    }
    for i, (color, hex_val, emoji) in enumerate([
        ('Red', '#FF0000', '🍎'), ('Blue', '#0000FF', '🫐'), ('Yellow', '#FFD700', '🌻'),
        ('Green', '#00AA00', '🍃'), ('Orange', '#FF6600', '🍊'), ('Purple', '#800080', '🍇'),
        ('Pink', '#FF69B4', '🌸'), ('Brown', '#8B4513', '🐻'), ('Black', '#000000', '🐧'),
        ('White', '#FFFFFF', '☁️'),
    ])
]

SHAPE_LESSONS = [
    {
        'title': f'Shape: {shape}', 'order': i,
        'content_json': {'type': 'shape_lesson', 'shape': shape, 'emoji': emoji, 'sides': sides,
                         'slides': [{'type': 'shape_display', 'shape': shape},
                                    {'type': 'find_shape', 'shape': shape, 'real_world': example}]},
        'duration_seconds': 90,
    }
    for i, (shape, emoji, sides, example) in enumerate([
        ('Circle', '⭕', 0, 'wheel'), ('Square', '⬛', 4, 'window'),
        ('Triangle', '🔺', 3, 'pizza slice'), ('Rectangle', '▬', 4, 'book'),
        ('Star', '⭐', 5, 'badge'), ('Heart', '❤️', 0, 'valentine'),
        ('Diamond', '💎', 4, 'kite'), ('Oval', '🥚', 0, 'egg'),
    ])
]

ANIMAL_LESSONS = [
    {
        'title': f'Animal: {animal}', 'order': i,
        'content_json': {'type': 'animal_lesson', 'animal': animal, 'emoji': emoji, 'sound': sound,
                         'habitat': habitat,
                         'slides': [{'type': 'animal_display', 'animal': animal, 'emoji': emoji},
                                    {'type': 'animal_sound', 'sound': sound},
                                    {'type': 'match_animal', 'animal': animal}]},
        'duration_seconds': 90,
    }
    for i, (animal, emoji, sound, habitat) in enumerate([
        ('Dog', '🐶', 'Woof!', 'home'), ('Cat', '🐱', 'Meow!', 'home'),
        ('Cow', '🐄', 'Moo!', 'farm'), ('Sheep', '🐑', 'Baa!', 'farm'),
        ('Lion', '🦁', 'Roar!', 'jungle'), ('Elephant', '🐘', 'Trumpet!', 'jungle'),
        ('Duck', '🦆', 'Quack!', 'pond'), ('Frog', '🐸', 'Ribbit!', 'pond'),
        ('Bird', '🐦', 'Tweet!', 'sky'), ('Fish', '🐟', 'Blub!', 'ocean'),
        ('Monkey', '🐒', 'Ooh-ooh!', 'jungle'), ('Tiger', '🐯', 'Growl!', 'jungle'),
    ])
]

STORY_LESSONS = [
    {
        'title': 'The Little Seed', 'order': 0,
        'content_json': {
            'type': 'story',
            'pages': [
                {'text': 'Once upon a time, there was a tiny little seed.', 'emoji': '🌱'},
                {'text': 'The seed was planted in the soft brown soil.', 'emoji': '🌍'},
                {'text': 'Every day, the sun shone bright and warm.', 'emoji': '☀️'},
                {'text': 'Rain fell gently from the clouds.', 'emoji': '🌧️'},
                {'text': 'Slowly, a tiny sprout pushed through the earth!', 'emoji': '🌿'},
                {'text': 'It grew and grew into a beautiful flower!', 'emoji': '🌸'},
                {'text': 'The end! What did you learn today?', 'emoji': '🌺'},
            ],
            'quiz': [{'question': 'What did the seed grow into?', 'answer': 'A flower', 'emoji': '🌸'}]
        },
        'duration_seconds': 180,
    },
    {
        'title': 'The Helpful Animals', 'order': 1,
        'content_json': {
            'type': 'story',
            'pages': [
                {'text': 'On a sunny day, the animals gathered together.', 'emoji': '🌞'},
                {'text': 'The dog wanted to build a house.', 'emoji': '🐶'},
                {'text': 'The cat brought some bricks.', 'emoji': '🐱'},
                {'text': 'The elephant lifted the heavy pieces.', 'emoji': '🐘'},
                {'text': 'Together, they built a wonderful home!', 'emoji': '🏠'},
                {'text': 'Everyone worked together and had fun!', 'emoji': '🎉'},
            ],
            'quiz': [{'question': 'Who helped lift the heavy things?', 'answer': 'Elephant', 'emoji': '🐘'}]
        },
        'duration_seconds': 180,
    },
]

GAMES_DATA = [
    {
        'title': 'Alphabet Match', 'game_type': 'alphabet_match', 'icon_emoji': '🔤',
        'description': 'Match the letter to the picture that starts with it!',
        'config_json': {
            'levels': [
                {'level': 1, 'items': [
                    {'letter': 'A', 'word': 'Apple', 'emoji': '🍎'},
                    {'letter': 'B', 'word': 'Ball', 'emoji': '⚽'},
                    {'letter': 'C', 'word': 'Cat', 'emoji': '🐱'},
                    {'letter': 'D', 'word': 'Dog', 'emoji': '🐶'},
                ]},
                {'level': 2, 'items': [
                    {'letter': 'E', 'word': 'Elephant', 'emoji': '🐘'},
                    {'letter': 'F', 'word': 'Fish', 'emoji': '🐟'},
                    {'letter': 'G', 'word': 'Grapes', 'emoji': '🍇'},
                    {'letter': 'H', 'word': 'Hat', 'emoji': '🎩'},
                ]},
                {'level': 3, 'items': [
                    {'letter': 'I', 'word': 'Ice cream', 'emoji': '🍦'},
                    {'letter': 'J', 'word': 'Juice', 'emoji': '🧃'},
                    {'letter': 'K', 'word': 'Kite', 'emoji': '🪁'},
                    {'letter': 'L', 'word': 'Lion', 'emoji': '🦁'},
                ]},
            ]
        }
    },
    {
        'title': 'Number Match', 'game_type': 'number_match', 'icon_emoji': '🔢',
        'description': 'Count the objects and match to the correct number!',
        'config_json': {
            'levels': [
                {'level': 1, 'max_number': 5},
                {'level': 2, 'max_number': 10},
                {'level': 3, 'max_number': 20},
            ]
        }
    },
    {
        'title': 'Memory Cards', 'game_type': 'memory_cards', 'icon_emoji': '🃏',
        'description': 'Flip the cards and find the matching pairs!',
        'config_json': {
            'levels': [
                {'level': 1, 'pairs': 4, 'theme': 'animals',
                 'items': ['🐶', '🐱', '🐻', '🐸']},
                {'level': 2, 'pairs': 6, 'theme': 'fruits',
                 'items': ['🍎', '🍊', '🍇', '🍓', '🍌', '🍋']},
                {'level': 3, 'pairs': 8, 'theme': 'mixed',
                 'items': ['⭐', '🌙', '☀️', '🌈', '🦋', '🌸', '🎈', '🎉']},
            ]
        }
    },
    {
        'title': 'Shape Sorter', 'game_type': 'shape_sorter', 'icon_emoji': '🔷',
        'description': 'Drag the shapes into their matching slots!',
        'config_json': {
            'levels': [
                {'level': 1, 'shapes': ['circle', 'square', 'triangle']},
                {'level': 2, 'shapes': ['circle', 'square', 'triangle', 'rectangle', 'star']},
                {'level': 3, 'shapes': ['circle', 'square', 'triangle', 'rectangle', 'star', 'heart', 'diamond', 'oval']},
            ]
        }
    },
    {
        'title': 'Counting Game', 'game_type': 'counting', 'icon_emoji': '🔢',
        'description': 'Count the items on screen and tap the right number!',
        'config_json': {
            'levels': [
                {'level': 1, 'max_count': 5, 'items': ['⭐', '🌸', '🎈']},
                {'level': 2, 'max_count': 10, 'items': ['🍎', '🐝', '🦋']},
                {'level': 3, 'max_count': 15, 'items': ['🌟', '🐠', '🌺']},
            ]
        }
    },
]

QUIZ_DATA = {
    'alphabet': {
        'title': 'Alphabet Quiz',
        'questions': [
            {'text': 'Which letter comes first?', 'type': 'multiple_choice',
             'answers': [('A', True), ('B', False), ('C', False), ('D', False)]},
            {'text': 'What letter does 🍎 Apple start with?', 'type': 'multiple_choice',
             'answers': [('B', False), ('A', True), ('C', False), ('D', False)]},
            {'text': 'Which letter does 🐱 Cat start with?', 'type': 'multiple_choice',
             'answers': [('C', True), ('K', False), ('S', False), ('T', False)]},
            {'text': 'Which letter does 🐶 Dog start with?', 'type': 'multiple_choice',
             'answers': [('B', False), ('G', False), ('D', True), ('P', False)]},
            {'text': 'Which letter does 🐘 Elephant start with?', 'type': 'multiple_choice',
             'answers': [('A', False), ('E', True), ('I', False), ('O', False)]},
        ]
    },
    'numbers': {
        'title': 'Numbers Quiz',
        'questions': [
            {'text': 'How many 🌟 are there? 🌟🌟🌟', 'type': 'multiple_choice',
             'answers': [('2', False), ('3', True), ('4', False), ('5', False)]},
            {'text': 'What number comes after 5?', 'type': 'multiple_choice',
             'answers': [('4', False), ('6', True), ('7', False), ('5', False)]},
            {'text': 'Count the 🍎: 🍎🍎🍎🍎🍎', 'type': 'multiple_choice',
             'answers': [('3', False), ('4', False), ('5', True), ('6', False)]},
            {'text': 'Which number is bigger?', 'type': 'multiple_choice',
             'answers': [('5', False), ('10', True), ('3', False), ('7', False)]},
            {'text': 'What is 2 + 2?', 'type': 'multiple_choice',
             'answers': [('3', False), ('5', False), ('4', True), ('6', False)]},
        ]
    },
    'colors': {
        'title': 'Colors Quiz',
        'questions': [
            {'text': 'What color is the 🍎 Apple?', 'type': 'multiple_choice',
             'answers': [('Blue', False), ('Red', True), ('Green', False), ('Yellow', False)]},
            {'text': 'What color is the 🌞 Sun?', 'type': 'multiple_choice',
             'answers': [('Yellow', True), ('Red', False), ('Blue', False), ('Green', False)]},
            {'text': 'What color is the 🌿 Leaf?', 'type': 'multiple_choice',
             'answers': [('Blue', False), ('Green', True), ('Red', False), ('Purple', False)]},
            {'text': 'What color is the 🫐 Blueberry?', 'type': 'multiple_choice',
             'answers': [('Blue', True), ('Red', False), ('Green', False), ('Yellow', False)]},
            {'text': 'Mix Red and Blue to get?', 'type': 'multiple_choice',
             'answers': [('Green', False), ('Orange', False), ('Purple', True), ('Yellow', False)]},
        ]
    },
}


class Command(BaseCommand):
    help = 'Seeds the database with sample preschool learning content'

    def handle(self, *args, **options):
        self.stdout.write('🌱 Seeding Little Learner database...')

        # Create modules
        module_map = {}
        for m_data in MODULES:
            module, created = LearningModule.objects.get_or_create(slug=m_data['slug'], defaults=m_data)
            module_map[m_data['slug']] = module
            if created:
                self.stdout.write(f'  ✓ Created module: {module.title}')

        # Alphabet lessons
        alpha_module = module_map['alphabet']
        for lesson_data in ALPHABET_LESSONS:
            Lesson.objects.get_or_create(
                module=alpha_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Number lessons
        num_module = module_map['numbers']
        for lesson_data in NUMBER_LESSONS:
            Lesson.objects.get_or_create(
                module=num_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Color lessons
        color_module = module_map['colors']
        for lesson_data in COLOR_LESSONS:
            Lesson.objects.get_or_create(
                module=color_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Shape lessons
        shape_module = module_map['shapes']
        for lesson_data in SHAPE_LESSONS:
            Lesson.objects.get_or_create(
                module=shape_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Animal lessons
        animal_module = module_map['animals']
        for lesson_data in ANIMAL_LESSONS:
            Lesson.objects.get_or_create(
                module=animal_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Story lessons
        story_module = module_map['stories']
        for lesson_data in STORY_LESSONS:
            Lesson.objects.get_or_create(
                module=story_module, title=lesson_data['title'],
                defaults=lesson_data
            )

        # Games
        for game_data in GAMES_DATA:
            game, created = Game.objects.get_or_create(
                title=game_data['title'],
                defaults=game_data
            )
            if created:
                self.stdout.write(f'  ✓ Created game: {game.title}')

        # Quizzes
        for slug, quiz_data in QUIZ_DATA.items():
            module = module_map.get(slug)
            if not module:
                continue
            quiz, created = Quiz.objects.get_or_create(
                module=module, title=quiz_data['title']
            )
            if created:
                for i, q_data in enumerate(quiz_data['questions']):
                    question = Question.objects.create(
                        quiz=quiz, text=q_data['text'],
                        question_type=q_data['type'], order=i, points=10
                    )
                    for j, (ans_text, is_correct) in enumerate(q_data['answers']):
                        Answer.objects.create(
                            question=question, text=ans_text,
                            is_correct=is_correct, order=j
                        )
                self.stdout.write(f'  ✓ Created quiz: {quiz.title}')

        self.stdout.write(self.style.SUCCESS('\n✅ Seeding complete! Database ready for Little Learner.'))
