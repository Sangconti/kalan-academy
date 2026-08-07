import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useNetwork } from '../hooks/useNetwork'
import {
  getCachedSubjects,
  cacheSubjects
} from '../offline/db'

import {
  BookOpen,
  ChevronRight,
  ArrowLeft
} from 'lucide-react'

import { getSubjects } from "../services/educationService"


export default function ClassPage() {

  const { classId } = useParams()

  const [subjects, setSubjects] = useState([])

  const [loading, setLoading] = useState(true)

  const { isOnline } = useNetwork()



  useEffect(() => {

    async function load() {

      try {


        if (isOnline) {


          const data = await getSubjects(classId)


          setSubjects(data || [])



          if (data && data.length > 0) {

            await cacheSubjects(data)

          }



        } else {


          const cached = await getCachedSubjects(classId)


          setSubjects(cached || [])


        }



      } catch (err) {


        console.error(
          "Erreur chargement matières:",
          err
        )


        setSubjects([])


      } finally {


        setLoading(false)


      }

    }


    load()


  }, [classId, isOnline])




  if (loading) {

    return (

      <div className="flex items-center justify-center py-20">

        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>

      </div>

    )

  }




  return (

    <div className="space-y-4">


      <Link
        to="/"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-blue-600 transition"
      >

        <ArrowLeft size={16} />

        Retour

      </Link>



      <h2 className="text-xl font-bold text-gray-800">

        Matières

      </h2>



      {subjects.length === 0 && (

        <div className="text-center py-10 text-gray-500 bg-white rounded-xl">

          <p>
            Aucune matière disponible pour cette classe.
          </p>

        </div>

      )}




      <div className="space-y-3">


        {subjects.map((subject)=>(


          <Link

            key={subject.id}

            to={`/subject/${subject.id}`}

            className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 hover:shadow-md hover:border-blue-200 transition flex items-center gap-3"

          >


            <div className="bg-green-50 p-2.5 rounded-lg">

              <BookOpen
                size={24}
                className="text-green-600"
              />

            </div>



            <div className="flex-1">

              <h3 className="font-semibold text-gray-800">

                {subject.name}

              </h3>

            </div>



            <ChevronRight
              size={18}
              className="text-gray-400"
            />


          </Link>


        ))}


      </div>


    </div>

  )

}