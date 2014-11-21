import itertools
import time
import sys
import thread
import random
import datetime
import sqlite3
from flask import Flask, Response, redirect, render_template, request, url_for
from flask_wtf import Form
from wtforms import StringField
from wtforms.validators import DataRequired


app = Flask(__name__)
app.config.from_object(__name__)
app.secret_key = 'development key'
temperature_data_file = "sous_vide.db"

class MyForm(Form):
  name = StringField('name', validators=[DataRequired()])

@app.route('/set_name', methods=['GET', 'POST'])
def set_name():
  print "Got the Submit!"
    #  if form.validate_on_submit():
    #    return redirect('/success')
#  return render_template('submit.html', form=form)
  return "ECHO: POST\n"


def create_db_tables():
  try:
    sqlcon = sqlite3.connect(temperature_data_file, detect_types=sqlite3.PARSE_DECLTYPES)
    cur = sqlcon.cursor()
    cur.execute("""CREATE TABLE TemperatureData(
                   ReadOutTime timestamp,
                   Temperature FLOAT)""")
    print "Created SQLite3 table"
    cur.close();
  
  except sqlite3.Error, e:
    print "Error: %s" % e.args[0]
    return

  finally:
    if sqlcon:
      sqlcon.close()

def monitor_temperature():
  sqlcon = None
  
  try:
    sqlcon = sqlite3.connect(temperature_data_file, detect_types=sqlite3.PARSE_DECLTYPES)

    while 1:
      cur = sqlcon.cursor()
      temperature = random.uniform(0, 10)
      statment = "INSERT INTO TemperatureData(ReadOutTime,Temperature) VALUES(?,?)"
      cur.execute(statment,(datetime.datetime.now(),temperature))
      sqlcon.commit()
      cur.close()
      time.sleep( 5 )

  except sqlite3.Error, e:
    print "Error monitoring temperature: %s" % e.args[0]

  finally:
    if sqlcon:
      sqlcon.commit()
      sqlcon.close()



@app.route('/')
def index(form=None):
  if form is None:
    form = MyForm()
  
  if request.headers.get('accept') == 'text/event-stream':
    def events():
      try:
        sqlcon = sqlite3.connect(temperature_data_file, detect_types=sqlite3.PARSE_DECLTYPES)
        last_readout_time = datetime.datetime.now() - datetime.timedelta(minutes=5)
      
        while 1:
          cur = sqlcon.cursor()
          statment = "SELECT ReadOutTime, Temperature FROM TemperatureData WHERE ReadOutTime > ? ORDER BY ReadOutTime ASC"
          cur.execute(statment,(last_readout_time,))
        
          rows = cur.fetchall()
          data = '['
          for row in rows:
            last_readout_time = row[0]
            if len(data) > 1 :
              data += ", "
            data += "{\"x\":\"" + row[0].strftime('%Y-%m-%dT%H:%M:%S') + "\",\"y\":\"" + str(row[1]) + "\"}";
          data += "]"
          yield "data: %s\n\n" % (data)
          time.sleep( 5 )
    
      except:
        print "Caught exception handling event"
  
    return Response(events(), content_type='text/event-stream')
  return render_template('main.html',form=form)

if __name__ == "__main__":
  create_db_tables()
  thread.start_new_thread(monitor_temperature, ())
  app.run(host='localhost', debug=True, port=8082 )
